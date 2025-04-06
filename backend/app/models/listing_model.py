from app import db
from datetime import datetime, timezone

class Listing(db.Model):
    __tablename__ = 'listings'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text) 
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50))
    seller_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))  # Track updates
    status = db.Column(db.String(20), default='active')  # active/removed/flagged
    moderator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    removal_reason = db.Column(db.String(200), nullable=True)  # Reason for admin removal

    # Relationships
    transactions = db.relationship('Transaction', back_populates='listing')

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "price": self.price,
            "category": self.category,
            "seller_id": self.seller_id,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

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
    rating = db.Column(db.Integer, nullable=True)  # Rating (1-5 stars)
    feedback = db.Column(db.Text, nullable=True)   # Optional text feedback
    
    def to_dict(self):
        return {
            "id": self.id,
            "qr_code": self.qr_code,
            "buyer_id": self.buyer_id,
            "seller_id": self.seller_id,
            "listing_id": self.listing_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed": self.completed,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "rating": self.rating,
            "feedback": self.feedback,
            # Relationship data (optional - include if needed)
            "buyer": {
                "id": self.buyer.id,
                "email": self.buyer.email
            } if self.buyer else None,
            "seller": {
                "id": self.seller.id,
                "email": self.seller.email
            } if self.seller else None,
            "listing": {
                "id": self.listing.id,
                "title": self.listing.title,
                "price": self.listing.price
            } if self.listing else None
        }

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