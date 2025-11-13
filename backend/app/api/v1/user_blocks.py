from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.user_block import UserBlock
from app.schemas.user_block import UserBlockCreate, UserBlockResponse
from app.schemas.user import MessageResponse

router = APIRouter(prefix="/api/user-blocks", tags=["User Blocks"])


@router.get("", response_model=list[UserBlockResponse])
async def list_blocks(
    user_id: int = Query(..., alias="userId"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[UserBlockResponse]:
    if user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    result = await db.execute(
        select(UserBlock)
        .where(UserBlock.user_id == current_user.id)
        .order_by(UserBlock.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=UserBlockResponse, status_code=status.HTTP_201_CREATED)
async def create_block(
    payload: UserBlockCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserBlockResponse:
    block = UserBlock(
        user_id=current_user.id,
        title=payload.title,
        data=payload.data,
        preview_url=payload.preview_url,
    )
    db.add(block)
    await db.commit()
    await db.refresh(block)
    return block


@router.delete("/{block_id}", response_model=MessageResponse)
async def delete_block(
    block_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    result = await db.execute(
        select(UserBlock).where(UserBlock.id == block_id, UserBlock.user_id == current_user.id)
    )
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found")
    await db.delete(block)
    await db.commit()
    return MessageResponse(detail="Block deleted")
