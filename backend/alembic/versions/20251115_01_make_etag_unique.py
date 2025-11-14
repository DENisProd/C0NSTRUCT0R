from alembic import op
import sqlalchemy as sa

revision = "20251115_01_make_etag_unique"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            """
DELETE FROM project_media pm
USING (
  SELECT id, row_number() OVER (PARTITION BY etag ORDER BY created_at DESC NULLS LAST, id DESC) AS rn
  FROM project_media
  WHERE etag IS NOT NULL
) d
WHERE pm.id = d.id AND d.rn > 1;
            """
        )
    )
    op.create_unique_constraint("uq_project_media_etag", "project_media", ["etag"])


def downgrade() -> None:
    op.drop_constraint("uq_project_media_etag", "project_media", type_="unique")