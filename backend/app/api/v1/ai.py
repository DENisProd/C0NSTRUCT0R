from fastapi import APIRouter, HTTPException
from app.schemas.ai import GenerateLandingRequest, GenerateLandingResponse
from app.services.llm_generator import MockLLMGenerator, LLMGenerator
from app.services.block_render import BlockRenderService

router = APIRouter()


@router.post("/generate-landing", response_model=GenerateLandingResponse)
async def generate_landing(request: GenerateLandingRequest):
    """
    Генерирует лендинг на основе промпта
    """
    try:
        # Генерируем лендинг через LLM (Gemini, если настроен, иначе mock)
        result = LLMGenerator.generate_landing(
            prompt=request.prompt,
            categories=request.categories or []
        )
        
        # Подготавливаем финальный JSON через BlockRenderService
        final_json = BlockRenderService.prepare_final_json(
            blocks=result.blocks,
            palette=result.palette.model_dump()
        )
        
        # Возвращаем результат
        return GenerateLandingResponse(
            blocks=final_json["blocks"],
            palette=result.palette,
            meta=result.meta
        )
    except Exception as e:
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


