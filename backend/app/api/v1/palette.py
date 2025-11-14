from typing import Any, Dict, List
import random

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.palette import Palette
from app.schemas.palette import PaletteCreate, PaletteResponse, PaletteSchema
from app.services.palette_generator import PaletteGenerator

router = APIRouter()

RANDOM_PALETTES: List[Dict[str, str]] = [
    {
        "name": "Neutral 1",
        "accent": "#101B39",
        "text": "#333136",
        "heading": "#101B39",
        "background": "#E9E8EE",
        "surface": "#FFFFFF",
        "border": "#B4B1B8",
    },
    {
        "name": "Neutral 2",
        "accent": "#9F624F",
        "text": "#59372B",
        "heading": "#4B2E24",
        "background": "#F7E7CE",
        "surface": "#FFFFFF",
        "border": "#CCA98D",
    },
    {
        "name": "Neutral 3",
        "accent": "#727A6B",
        "text": "#383931",
        "heading": "#1C2915",
        "background": "#EDE3D9",
        "surface": "#CCD5C4",
        "border": "#AF9D89",
    },
    {
        "name": "Neutral 4",
        "accent": "#333333",
        "text": "#555555",
        "heading": "#000000",
        "background": "#FFFFFF",
        "surface": "#F4F4F4",
        "border": "#CCCCCC",
    },
    {
        "name": "Pastel 1",
        "accent": "#98BAD5",
        "text": "#304674",
        "heading": "#26385C",
        "background": "#EAF4FB",
        "surface": "#C6D3E3",
        "border": "#AFC6DC",
    },
    {
        "name": "Pastel 2",
        "accent": "#F0B6D5",
        "text": "#4C3B3B",
        "heading": "#2C2222",
        "background": "#FFF0F5",
        "surface": "#FFD1DC",
        "border": "#E4A0B7",
    },
    {
        "name": "Pastel 3",
        "accent": "#CCAEDB",
        "text": "#332E41",
        "heading": "#4B2E83",
        "background": "#EFDFF9",
        "surface": "#DCC0EC",
        "border": "#B195C0",
    },
    {
        "name": "Vivid 1",
        "accent": "#2196F3",
        "text": "#212121",
        "heading": "#0D0D0D",
        "background": "#FFFFFF",
        "surface": "#E3F2FD",
        "border": "#90CAF9",
    },
    {
        "name": "Vivid 2",
        "accent": "#4CAF50",
        "text": "#212121",
        "heading": "#0D0D0D",
        "background": "#F1F8E9",
        "surface": "#FFFFFF",
        "border": "#AED581",
    },
    {
        "name": "Vivid 3",
        "accent": "#FF6F61",
        "text": "#212121",
        "heading": "#000000",
        "background": "#FFFFFF",
        "surface": "#FBE9E7",
        "border": "#FFCCBC",
    },
]


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


@router.get("/random", response_model=Dict[str, str])
async def get_random_palette():
    """
    Возвращает одну случайную палитру из набора предопределённых
    """
    return random.choice(RANDOM_PALETTES)


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
