from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.palette import Palette
from app.schemas.palette import PaletteCreate, PaletteResponse, PaletteSchema
from app.services.palette_generator import PaletteGenerator

router = APIRouter()


class ApplyPaletteRequest(BaseModel):
    """Запрос на применение палитры"""
    blocks: List[Dict[str, Any]]
    palette: PaletteSchema


@router.post("/apply", response_model=Dict[str, Any])
async def apply_palette(request: ApplyPaletteRequest):
    """
    Применяет цветовую палитру к блокам лендинга
    
    Принимает:
    - blocks: список блоков
    - palette: цветовая палитра
    
    Возвращает:
    - blocks: обновленные блоки с примененными цветами
    """
    updated_blocks = []
    
    for block in request.blocks:
        updated_block = block.copy()
        
        # Применяем цвета из палитры к стилям блоков
        if "style" not in updated_block:
            updated_block["style"] = {}
        
        style = updated_block["style"]
        
        # Применяем цвета в зависимости от типа блока
        if updated_block.get("type") == "text":
            style["color"] = request.palette.text
        elif updated_block.get("type") == "button":
            style["backgroundColor"] = request.palette.accent
            style["color"] = "#ffffff"  # Белый текст на акцентном фоне
        
        # Применяем фоновый цвет для контейнеров
        if updated_block.get("type") == "container":
            style["backgroundColor"] = request.palette.surface or request.palette.background
        
        updated_block["style"] = style
        updated_blocks.append(updated_block)
        
        # Рекурсивно обрабатываем дочерние блоки
        if "children" in updated_block and isinstance(updated_block["children"], list):
            updated_block["children"] = apply_palette_to_blocks_sync(
                updated_block["children"],
                request.palette
            )
    
    return {"blocks": updated_blocks}


def apply_palette_to_blocks_sync(
    blocks: List[Dict[str, Any]],
    palette: PaletteSchema
) -> List[Dict[str, Any]]:
    """Вспомогательная функция для рекурсивного применения палитры"""
    result = []
    for block in blocks:
        updated_block = block.copy()
        if "style" not in updated_block:
            updated_block["style"] = {}
        
        style = updated_block["style"]
        
        if updated_block.get("type") == "text":
            style["color"] = palette.text
        elif updated_block.get("type") == "button":
            style["backgroundColor"] = palette.accent
            style["color"] = "#ffffff"
        
        if updated_block.get("type") == "container":
            style["backgroundColor"] = palette.surface or palette.background
        
        updated_block["style"] = style
        
        if "children" in updated_block and isinstance(updated_block["children"], list):
            updated_block["children"] = apply_palette_to_blocks_sync(
                updated_block["children"],
                palette
            )
        
        result.append(updated_block)
    
    return result


@router.get("/list", response_model=List[Dict[str, Any]])
async def get_palette_list():
    """
    Возвращает список предустановленных палитр
    """
    return PaletteGenerator.get_preset_palettes()


class GeneratePaletteRequest(BaseModel):
    """Запрос на генерацию палитры"""
    description: str


@router.post("/generate", response_model=PaletteSchema)
async def generate_palette(request: GeneratePaletteRequest):
    """
    Генерирует цветовую палитру на основе описания/темы
    """
    return PaletteGenerator.generate_from_description(request.description)


@router.post("/", response_model=PaletteResponse)
async def create_palette(
    palette_data: PaletteCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Создает новую палитру
    """
    new_palette = Palette(
        name=palette_data.name,
        project_id=palette_data.project_id,
        primary=palette_data.palette.primary,
        secondary=palette_data.palette.secondary,
        background=palette_data.palette.background,
        text=palette_data.palette.text,
        accent=palette_data.palette.accent,
        surface=palette_data.palette.surface,
        border=palette_data.palette.border,
        additional_colors=palette_data.palette.additional_colors,
        description=palette_data.description,
        is_preset=palette_data.is_preset
    )
    
    db.add(new_palette)
    await db.commit()
    await db.refresh(new_palette)
    
    return PaletteResponse(
        id=new_palette.id,
        name=new_palette.name,
        project_id=new_palette.project_id,
        primary=new_palette.primary,
        secondary=new_palette.secondary,
        background=new_palette.background,
        text=new_palette.text,
        accent=new_palette.accent,
        surface=new_palette.surface,
        border=new_palette.border,
        additional_colors=new_palette.additional_colors,
        description=new_palette.description,
        is_preset=new_palette.is_preset,
        created_at=new_palette.created_at,
    )
