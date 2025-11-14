import io
import uuid
import logging
from pathlib import Path
from typing import Optional, Tuple

from fastapi import UploadFile
from minio import Minio
from minio.error import S3Error
from PIL import Image, UnidentifiedImageError

from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    RESAMPLE = Image.Resampling.LANCZOS  # Pillow >= 9
except AttributeError:  # pragma: no cover
    RESAMPLE = Image.LANCZOS


class MinioService:
    PROJECT_WIDTH = 1280
    PROJECT_HEIGHT = 720
    AVATAR_SIZE = 50

    def __init__(self) -> None:
        self.bucket = settings.MINIO_MAIN_BUCKET
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self._ensure_bucket()

    def _ensure_bucket(self) -> None:
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
        except S3Error as exc:
            # Access can be restricted for service accounts; log and continue so the app still starts.
            logger.warning(
                "Skipping MinIO bucket ensure due to error: %s (code=%s)",
                exc.message,
                exc.code,
            )

    async def upload_project_media(self, project_id: int, file: UploadFile) -> dict:
        data = await file.read()
        processed_bytes, content_type = self._process_image(
            data,
            file.filename,
            file.content_type,
            target_width=self.PROJECT_WIDTH,
            target_height=self.PROJECT_HEIGHT,
            crop_to_aspect=False,
        )

        object_name = f"projects/{project_id}/{uuid.uuid4()}-{file.filename}"
        bytes_io = io.BytesIO(processed_bytes)
        result = self.client.put_object(
            self.bucket,
            object_name,
            data=bytes_io,
            length=len(processed_bytes),
            content_type=content_type,
        )
        url = self._build_file_url(object_name)
        return {
            "bucket": self.bucket,
            "object_name": object_name,
            "etag": getattr(result, "etag", None),
            "version_id": getattr(result, "version_id", None),
            "file_url": url,
            "content_type": content_type,
            "size": len(processed_bytes),
        }

    async def upload_user_avatar(self, user_id: int, file: UploadFile) -> dict:
        data = await file.read()
        processed_bytes, content_type = self._process_image(
            data,
            file.filename,
            file.content_type,
            target_width=self.AVATAR_SIZE,
            target_height=self.AVATAR_SIZE,
            force_format="PNG",
        )

        object_name = self.avatar_object_name(user_id)
        bytes_io = io.BytesIO(processed_bytes)
        result = self.client.put_object(
            self.bucket,
            object_name,
            data=bytes_io,
            length=len(processed_bytes),
            content_type=content_type,
        )
        url = self._build_file_url(object_name)
        return {
            "bucket": self.bucket,
            "object_name": object_name,
            "etag": getattr(result, "etag", None),
            "version_id": getattr(result, "version_id", None),
            "file_url": url,
            "content_type": content_type,
            "size": len(processed_bytes),
        }

    def _build_file_url(self, object_name: str) -> Optional[str]:
        base = settings.MINIO_PUBLIC_ENDPOINT
        if not base:
            scheme = "https" if settings.MINIO_SECURE else "http"
            base = f"{scheme}://{settings.MINIO_ENDPOINT}"
        return f"{base.rstrip('/')}/{self.bucket}/{object_name}"

    def delete_object(self, bucket: Optional[str], object_name: str) -> None:
        target_bucket = bucket or self.bucket
        try:
            self.client.remove_object(target_bucket, object_name)
        except S3Error as exc:
            logger.warning(
                "Failed to delete object '%s/%s' from MinIO: %s (code=%s)",
                target_bucket,
                object_name,
                exc.message,
                exc.code,
            )

    def get_object_stream(self, bucket: Optional[str], object_name: str):
        target_bucket = bucket or self.bucket
        try:
            return self.client.get_object(target_bucket, object_name)
        except S3Error as exc:
            logger.warning(
                "Failed to retrieve object '%s/%s' from MinIO: %s (code=%s)",
                target_bucket,
                object_name,
                exc.message,
                exc.code,
            )
            raise

    def avatar_object_name(self, user_id: int) -> str:
        return f"avatars/{user_id}/avatar.png"

    def _process_image(
        self,
        data: bytes,
        filename: str,
        content_type: Optional[str],
        *,
        target_width: int,
        target_height: int,
        force_format: Optional[str] = None,
        crop_to_aspect: bool = True,
    ) -> Tuple[bytes, str]:
        try:
            image = Image.open(io.BytesIO(data))
        except UnidentifiedImageError as exc:  # pragma: no cover - depends on Pillow internals
            raise ValueError("Uploaded file is not a valid image") from exc

        if crop_to_aspect:
            image = self._crop_to_aspect(image, target_width / target_height)
            image = image.resize((target_width, target_height), RESAMPLE)
        else:
            w, h = image.size
            ratio = w / h
            target_ratio = target_width / target_height
            if ratio > target_ratio:
                new_w = target_width
                new_h = int(target_width / ratio)
            else:
                new_h = target_height
                new_w = int(target_height * ratio)
            image = image.resize((new_w, new_h), RESAMPLE)

        save_format = force_format or self._determine_format(image, filename, content_type)
        if save_format.upper() in {"JPEG", "JPG"} and image.mode not in ("RGB", "L"):
            image = image.convert("RGB")
        elif save_format.upper() == "PNG" and image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA")

        buffer = io.BytesIO()
        save_kwargs = {"format": save_format}
        if save_format.upper() in {"JPEG", "JPG"}:
            save_kwargs.update({"quality": 90, "optimize": True})
        else:
            save_kwargs.update({"optimize": True})
        image.save(buffer, **save_kwargs)
        processed = buffer.getvalue()
        return processed, self._content_type_for_format(save_format)

    @staticmethod
    def _content_type_for_format(fmt: str) -> str:
        fmt = fmt.upper()
        if fmt in {"JPG", "JPEG"}:
            return "image/jpeg"
        if fmt == "PNG":
            return "image/png"
        if fmt == "WEBP":
            return "image/webp"
        return f"image/{fmt.lower()}"

    @staticmethod
    def _determine_format(image: Image.Image, filename: str, content_type: Optional[str]) -> str:
        if content_type:
            subtype = content_type.split("/")[-1].lower()
            if subtype in {"jpeg", "jpg"}:
                return "JPEG"
            if subtype == "png":
                return "PNG"
            if subtype == "webp":
                return "WEBP"

        suffix = Path(filename or "").suffix.lower()
        if suffix in {".jpeg", ".jpg"}:
            return "JPEG"
        if suffix == ".png":
            return "PNG"
        if suffix == ".webp":
            return "WEBP"

        if image.format:
            return image.format
        return "PNG"

    @staticmethod
    def _crop_to_aspect(image: Image.Image, target_ratio: float) -> Image.Image:
        width, height = image.size
        if width == 0 or height == 0:
            raise ValueError("Invalid image dimensions")
        current_ratio = width / height
        if abs(current_ratio - target_ratio) < 1e-3:
            return image

        if current_ratio > target_ratio:
            new_width = int(height * target_ratio)
            offset = max((width - new_width) // 2, 0)
            return image.crop((offset, 0, offset + new_width, height))

        new_height = int(width / target_ratio)
        offset = max((height - new_height) // 2, 0)
        return image.crop((0, offset, width, offset + new_height))


minio_service = MinioService()
