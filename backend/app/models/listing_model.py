from app import db
from datetime import datetime, timezone

class Listing(db.Model):
    __tablename__ = 'listings'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    seller_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    status = db.Column(db.String(20), default='active')  # active/removed/flagged
    moderator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    # Relationships
    transactions = db.relationship('Transaction', back_populates='listing')

class Transaction(db.Model):
    __tablename__ = 'transactions'
    id = db.Column(db.Integer, primary_key=True)
    qr_code = db.Column(db.String(100), unique=True)
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    seller_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    listing_id = db.Column(db.Integer, db.ForeignKey('listings.id'))
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)) #Should record when the transaction was initially created (QR generated)
    completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime)  # Records when the transaction was marked as completed (after QR confirmation)
    rating = db.Column(db.Integer)  # New field (1-5)
    
    # Relationships
    buyer = db.relationship(
        'User',
        foreign_keys=[buyer_id],
        back_populates='purchases'
    )
    seller = db.relationship(
        'User',
        foreign_keys=[seller_id],
        back_populates='sales'
    )

    listing = db.relationship('Listing', back_populates='transactions')