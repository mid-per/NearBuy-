"""Add soft delete fields to User model

Revision ID: 04f5d45c8124
Revises: 783114fa60d5
Create Date: 2025-04-20 02:46:14.105232

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '04f5d45c8124'
down_revision = '783114fa60d5'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_deleted', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('deleted_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('original_email', sa.String(length=80), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('original_email')
        batch_op.drop_column('deleted_at')
        batch_op.drop_column('is_deleted')

    # ### end Alembic commands ###
