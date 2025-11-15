"""make etag unique on project_media

Revision ID: 20251115_01_make_etag_unique
Revises: None
Create Date: 2025-11-15

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20251115_01_make_etag_unique"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
        IF NOT EXISTS (
           SELECT 1
           FROM pg_constraint c
           WHERE c.conname = 'uq_project_media_etag'
        ) THEN
           ALTER TABLE project_media ADD CONSTRAINT uq_project_media_etag UNIQUE (etag);
        END IF;
        END$$;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
        IF EXISTS (
           SELECT 1
           FROM pg_constraint c
           WHERE c.conname = 'uq_project_media_etag'
        ) THEN
           ALTER TABLE project_media DROP CONSTRAINT uq_project_media_etag;
        END IF;
        END$$;
        """
    )