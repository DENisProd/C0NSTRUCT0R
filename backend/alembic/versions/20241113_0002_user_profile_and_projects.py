"""Add profile fields and project tables

Revision ID: 20241113_0002
Revises: 20241112_0001
Create Date: 2025-11-13 17:45:00
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "20241113_0002"
down_revision: Union[str, None] = "20241112_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("nickname", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("avatar_url", sa.Text(), nullable=True))

    op.create_table(
        "projects",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column("preview_url", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_projects_id"), "projects", ["id"], unique=False)
    op.create_index(op.f("ix_projects_user_id"), "projects", ["user_id"], unique=False)

    op.create_table(
        "user_blocks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column("preview_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_blocks_id"), "user_blocks", ["id"], unique=False)
    op.create_index(op.f("ix_user_blocks_user_id"), "user_blocks", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_blocks_user_id"), table_name="user_blocks")
    op.drop_index(op.f("ix_user_blocks_id"), table_name="user_blocks")
    op.drop_table("user_blocks")
    op.drop_index(op.f("ix_projects_user_id"), table_name="projects")
    op.drop_index(op.f("ix_projects_id"), table_name="projects")
    op.drop_table("projects")
    op.drop_column("users", "avatar_url")
    op.drop_column("users", "nickname")
