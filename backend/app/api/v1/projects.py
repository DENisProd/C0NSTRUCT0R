from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import func

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectListItem, ProjectResponse, ProjectUpdate
from app.schemas.user import MessageResponse

router = APIRouter(prefix="/api/projects", tags=["Projects"])


async def _get_project_or_404(
    project_id: int,
    user: User,
    db: AsyncSession,
) -> Project:
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == user.id,
            Project.deleted_at.is_(None),
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.get("", response_model=list[ProjectListItem])
async def list_projects(
    user_id: int = Query(..., alias="userId"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ProjectListItem]:
    if user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    result = await db.execute(
        select(Project)
            .where(Project.user_id == current_user.id, Project.deleted_at.is_(None))
            .order_by(Project.updated_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    project = Project(
        user_id=current_user.id,
        title=payload.title,
        data=payload.data,
        preview_url=payload.preview_url,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    project = await _get_project_or_404(project_id, current_user, db)
    return project


@router.patch("/{project_id}", response_model=MessageResponse)
async def update_project(
    project_id: int,
    payload: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    project = await _get_project_or_404(project_id, current_user, db)

    if payload.title is not None:
        project.title = payload.title
    if payload.data is not None:
        project.data = payload.data
    if payload.preview_url is not None:
        project.preview_url = payload.preview_url

    db.add(project)
    await db.commit()
    return MessageResponse(detail="Project updated")


@router.delete("/{project_id}", response_model=MessageResponse)
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    project = await _get_project_or_404(project_id, current_user, db)
    project.deleted_at = func.now()
    db.add(project)
    await db.commit()
    return MessageResponse(detail="Project deleted")
