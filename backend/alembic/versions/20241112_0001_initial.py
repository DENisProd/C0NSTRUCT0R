"""Initial database schema

Revision ID: 20241112_0001
Revises:
Create Date: 2025-11-12 13:45:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "20241112_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("has_avatar", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("username"),
    )
    op.create_index("ix_users_username", "users", ["username"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=False)

    op.create_table(
        "palettes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=True),
        sa.Column("primary", sa.String(length=7), nullable=False),
        sa.Column("secondary", sa.String(length=7), nullable=True),
        sa.Column("background", sa.String(length=7), nullable=False),
        sa.Column("text", sa.String(length=7), nullable=False),
        sa.Column("accent", sa.String(length=7), nullable=False),
        sa.Column("surface", sa.String(length=7), nullable=True),
        sa.Column("border", sa.String(length=7), nullable=True),
        sa.Column("additional_colors", sa.JSON(), nullable=True),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("is_preset", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_palettes_project_id", "palettes", ["project_id"], unique=False)

    op.create_table(
        "blocks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("author", sa.String(length=255), nullable=True),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("json_config", sa.JSON(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("preview", sa.String(length=500), nullable=True),
        sa.Column("is_public", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("is_custom", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_blocks_author", "blocks", ["author"], unique=False)
    op.create_index("ix_blocks_category", "blocks", ["category"], unique=False)
    op.create_index("ix_blocks_is_custom", "blocks", ["is_custom"], unique=False)
    op.create_index("ix_blocks_name", "blocks", ["name"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_blocks_name", table_name="blocks")
    op.drop_index("ix_blocks_is_custom", table_name="blocks")
    op.drop_index("ix_blocks_category", table_name="blocks")
    op.drop_index("ix_blocks_author", table_name="blocks")
    op.drop_table("blocks")

    op.drop_index("ix_palettes_project_id", table_name="palettes")
    op.drop_table("palettes")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_table("users")
