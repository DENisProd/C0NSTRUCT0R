from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.block import Block
from app.schemas.block import BlockCreate, BlockResponse, BlockUpdate
from app.services.block_render import BlockRenderService

router = APIRouter()


def _to_response(block: Block) -> BlockResponse:
    return BlockResponse(
        id=block.id,
        name=block.name,
        description=block.description,
        category=block.category,
        tags=block.tags if isinstance(block.tags, list) else [],
        author=block.author,
        preview=block.preview,
        blocks=block.json_config if isinstance(block.json_config, list) else [],
        is_custom=block.is_custom,
        created_at=block.created_at,
    )


def _filter_by_tags(blocks: List[Block], tags: Optional[str]) -> List[Block]:
    if not tags:
        return blocks
    tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
    if not tag_list:
        return blocks
    filtered: List[Block] = []
    for block in blocks:
        block_tags = block.tags if isinstance(block.tags, list) else []
        if any(tag in block_tags for tag in tag_list):
            filtered.append(block)
    return filtered


@router.get("/blocks", response_model=List[BlockResponse])
async def get_blocks(
    category: Optional[str] = Query(None, description="Фильтр по категории"),
    tags: Optional[str] = Query(None, description="Фильтр по тегам (через запятую)"),
    author: Optional[str] = Query(None, description="Фильтр по автору"),
    is_custom: Optional[bool] = Query(None, description="Фильтр пользовательских блоков"),
    db: AsyncSession = Depends(get_db),
):
    """
    Возвращает список системных и пользовательских блоков
    
    Поддерживает фильтрацию по:
    - category: категория блока
    - tags: теги (через запятую)
    - author: автор блока
    - is_custom: пользовательские блоки (true/false)
    """
    stmt = select(Block)
    if category:
        stmt = stmt.where(Block.category == category)
    if author:
        stmt = stmt.where(Block.author == author)
    if is_custom is not None:
        stmt = stmt.where(Block.is_custom == is_custom)

    result = await db.execute(stmt)
    blocks = _filter_by_tags(result.scalars().all(), tags)
    return [_to_response(block) for block in blocks]


@router.get("/ready", response_model=List[BlockResponse])
async def get_ready_blocks(
    category: Optional[str] = Query(None, description="Фильтр по категории"),
    tags: Optional[str] = Query(None, description="Фильтр по тегам (через запятую)"),
    author: Optional[str] = Query(None, description="Фильтр по автору"),
    db: AsyncSession = Depends(get_db),
):
    """
    Возвращает список готовых (системных) блоков из БД
    """
    stmt = select(Block).where(Block.is_custom.is_(False))

    if category:
        stmt = stmt.where(Block.category == category)
    if author:
        stmt = stmt.where(Block.author == author)

    result = await db.execute(stmt)
    blocks = _filter_by_tags(result.scalars().all(), tags)
    return [_to_response(block) for block in blocks]


@router.get("/block/{block_id}", response_model=BlockResponse)
async def get_block(block_id: int, db: AsyncSession = Depends(get_db)):
    """
    Возвращает полные данные конкретного блока по ID
    """
    block = await db.get(Block, block_id)
    
    if not block:
        raise HTTPException(status_code=404, detail="Блок не найден")
    
    return _to_response(block)


@router.post("/upload", response_model=BlockResponse)
async def upload_block(block_data: BlockCreate, db: AsyncSession = Depends(get_db)):
    """
    Загружает пользовательский блок
    
    Принимает:
    - name: название блока
    - description: описание
    - category: категория
    - tags: список тегов
    - blocks: JSON конфигурация блоков
    - preview: URL превью (опционально)
    - author: автор (опционально)
    """
    # Валидация блоков
    for block in block_data.blocks:
        if not BlockRenderService.validate_block(block):
            raise HTTPException(
                status_code=400,
                detail=f"Некорректная структура блока: {block.get('id', 'unknown')}"
            )
    
    # Создаем новый блок
    new_block = Block(
        name=block_data.name,
        description=block_data.description,
        category=block_data.category,
        tags=block_data.tags or [],
        json_config=block_data.blocks,
        preview=block_data.preview,
        author=block_data.author or "user",
        is_custom=True,
        is_public=True
    )
    
    db.add(new_block)
    await db.commit()
    await db.refresh(new_block)
    
    return _to_response(new_block)


@router.post("/ready", response_model=BlockResponse)
async def create_ready_block(block_data: BlockCreate, db: AsyncSession = Depends(get_db)):
    """
    Создает готовый (системный) блок на основе JSON-конфигурации
    """
    for block in block_data.blocks:
        if not BlockRenderService.validate_block(block):
            raise HTTPException(
                status_code=400,
                detail=f"Некорректная структура блока: {block.get('id', 'unknown')}"
            )

    new_block = Block(
        name=block_data.name,
        description=block_data.description,
        category=block_data.category,
        tags=block_data.tags or [],
        json_config=block_data.blocks,
        preview=block_data.preview,
        author=block_data.author or "system",
        is_custom=False,
        is_public=True,
    )

    db.add(new_block)
    await db.commit()
    await db.refresh(new_block)

    return _to_response(new_block)


@router.put("/block/{block_id}", response_model=BlockResponse)
async def update_block(
    block_id: int,
    block_data: BlockUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Обновляет пользовательский блок
    """
    block = await db.get(Block, block_id)
    
    if not block:
        raise HTTPException(status_code=404, detail="Блок не найден")
    
    if not block.is_custom:
        raise HTTPException(status_code=403, detail="Нельзя редактировать системные блоки")
    
    # Обновляем поля
    if block_data.name is not None:
        block.name = block_data.name
    if block_data.description is not None:
        block.description = block_data.description
    if block_data.category is not None:
        block.category = block_data.category
    if block_data.tags is not None:
        block.tags = block_data.tags
    if block_data.blocks is not None:
        # Валидация блоков
        for b in block_data.blocks:
            if not BlockRenderService.validate_block(b):
                raise HTTPException(
                    status_code=400,
                    detail=f"Некорректная структура блока: {b.get('id', 'unknown')}"
                )
        block.json_config = block_data.blocks
    if block_data.preview is not None:
        block.preview = block_data.preview
    
    await db.commit()
    await db.refresh(block)
    
    return _to_response(block)


@router.delete("/block/{block_id}")
async def delete_block(block_id: int, db: AsyncSession = Depends(get_db)):
    """
    Удаляет пользовательский блок
    """
    block = await db.get(Block, block_id)
    
    if not block:
        raise HTTPException(status_code=404, detail="Блок не найден")
    
    if not block.is_custom:
        raise HTTPException(status_code=403, detail="Нельзя удалять системные блоки")
    
    await db.delete(block)
    await db.commit()
    
    return {"message": "Блок успешно удален"}
