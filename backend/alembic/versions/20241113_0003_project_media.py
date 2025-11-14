"""Add project media table

Revision ID: 20241113_0003
Revises: 20241113_0002
Create Date: 2025-11-13 18:10:00
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "20241113_0003"
down_revision: Union[str, None] = "20241113_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "project_media",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("bucket", sa.String(length=255), nullable=False),
        sa.Column("object_name", sa.String(length=512), nullable=False),
        sa.Column("etag", sa.String(length=128), nullable=True),
        sa.Column("version_id", sa.String(length=128), nullable=True),
        sa.Column("content_type", sa.String(length=128), nullable=True),
        sa.Column("file_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_project_media_id"), "project_media", ["id"], unique=False)
    op.create_index(op.f("ix_project_media_project_id"), "project_media", ["project_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_project_media_project_id"), table_name="project_media")
    op.drop_index(op.f("ix_project_media_id"), table_name="project_media")
    op.drop_table("project_media")
