from app import db
from datetime import datetime, timezone, timedelta

class Listing(db.Model):
    __tablename__ = 'listings'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text) 
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50))
    image_url = db.Column(db.String(255)) 
    seller_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))  # Track updates
    status = db.Column(db.String(20), default='active')  # active/removed/flagged/sold
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
            "image_url": self.image_url,
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
    status = db.Column(db.String(20), default='pending')  # pending/completed/disputed/refunded
    dispute_reason = db.Column(db.Text, nullable=True)
    disputed_at = db.Column(db.DateTime, nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)

    # Status check helpers
    def is_disputable(self):
        return self.status in ('pending', 'completed') and \
               datetime.now(timezone.utc) < self.created_at + timedelta(days=3)
    
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
            "status": self.status,
            "dispute_reason": self.dispute_reason,
            "can_dispute": self.is_disputable(),
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
    chat_room = db.relationship('ChatRoom', back_populates='transaction', uselist=False)

from app.models.transaction_status_history import TransactionStatusHistory
Transaction.status_history = db.relationship(
    'TransactionStatusHistory', 
    backref='transaction',
    lazy=True
)
