import logging
from fastapi import APIRouter, HTTPException
from app.schemas.ai import GenerateLandingRequest, GenerateLandingResponse
from app.services.llm_generator import MockLLMGenerator
from app.services.block_render import BlockRenderService
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger("api.ai")


@router.post("/generate-landing", response_model=GenerateLandingResponse)
async def generate_landing(request: GenerateLandingRequest):
    """
    Генерирует лендинг на основе промпта
    """
    try:
        logger.info("AI generate_landing request: prompt=%r categories=%s", request.prompt, request.categories)
        error_meta = None
        if settings.GEMINI_API_KEY:
            from app.services.gemini_landing_generator import GeminiLLMGenerator
            try:
                result = GeminiLLMGenerator.generate_landing(
                    prompt=request.prompt,
                    categories=request.categories or []
                )
            except Exception as ge:
                try:
                    from google.genai.errors import ClientError
                except Exception:
                    ClientError = None
                if ClientError and isinstance(ge, ClientError):
                    logger.error("Gemini client error: %s", ge)
                    error_meta = {
                        "gemini_error": {
                            "message": str(ge),
                            "code": getattr(ge, "status_code", None),
                        }
                    }
                else:
                    logger.warning("Gemini failed, fallback to mock: %s", ge)
                    error_meta = {"gemini_error": {"message": str(ge)}}
                result = MockLLMGenerator.generate_landing(
                    prompt=request.prompt,
                    categories=request.categories or []
                )
        else:
            result = MockLLMGenerator.generate_landing(
                prompt=request.prompt,
                categories=request.categories or []
            )
        
        # Подготавливаем финальный JSON через BlockRenderService
        final_json = BlockRenderService.prepare_final_json(
            blocks=result.blocks,
            palette=result.palette.model_dump()
        )
        
        # Возвращаем результат
        merged_meta = result.meta or {}
        if error_meta:
            merged_meta = {**merged_meta, **error_meta}
        return GenerateLandingResponse(
            blocks=final_json["blocks"],
            palette=result.palette,
            meta=merged_meta
        )
    except Exception as e:
        logger.exception("AI generate_landing failed: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка генерации лендинга: {str(e)}"
        )


@router.get("/supported-blocks")
async def get_supported_blocks():
    """
    Возвращает список всех поддерживаемых типов блоков
    """
    return {
        "blocks": [
            {
                "type": "text",
                "description": "Текстовый блок",
                "required_fields": ["id", "type", "content"]
            },
            {
                "type": "image",
                "description": "Блок изображения",
                "required_fields": ["id", "type", "url"]
            },
            {
                "type": "button",
                "description": "Кнопка",
                "required_fields": ["id", "type", "text"]
            },
            {
                "type": "video",
                "description": "Видео блок",
                "required_fields": ["id", "type", "url"]
            },
            {
                "type": "container",
                "description": "Контейнер для других блоков",
                "required_fields": ["id", "type", "children"]
            },
            {
                "type": "grid",
                "description": "Сетка блоков",
                "required_fields": ["id", "type", "settings", "cells"]
            }
        ]
    }


