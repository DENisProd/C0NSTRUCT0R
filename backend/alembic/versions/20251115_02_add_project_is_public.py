"""add is_public to projects

Revision ID: 20251115_02_add_project_is_public
Revises: 20251115_01_make_etag_unique
Create Date: 2025-11-15

"""
from alembic import op
import sqlalchemy as sa


revision = "20251115_02_add_is_public"
down_revision = "20251115_01_make_etag_unique"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.execute("UPDATE projects SET is_public = false WHERE is_public IS NULL")
    op.alter_column("projects", "is_public", server_default=None)


def downgrade() -> None:
    op.drop_column("projects", "is_public")