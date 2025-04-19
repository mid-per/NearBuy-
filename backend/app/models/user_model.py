from app import db
from sqlalchemy import event
from werkzeug.security import generate_password_hash

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)  # True = admin, False = customer
    avatar = db.Column(db.String(255))  
    name = db.Column(db.String(80))  
    bio = db.Column(db.String(500))  
    location = db.Column(db.String(100))  
    phone = db.Column(db.String(20), 
                     info={'check_constraint': 'length(phone) >= 8'})
    is_deleted = db.Column(db.Boolean, default=False)  
    deleted_at = db.Column(db.DateTime, nullable=True) 
    original_email = db.Column(db.String(80))  # Store original email before anonymization
    # As a SELLER (listings they created)
    listings = db.relationship(
        'Listing', 
        backref='seller', 
        lazy=True,
        foreign_keys='Listing.seller_id'
    )

    # As a BUYER (transactions they initiated)
    purchases = db.relationship(
        'Transaction',
        foreign_keys='Transaction.buyer_id',
        back_populates='buyer',
        lazy=True
    )

    # As a SELLER (transactions where they sold items)
    sales = db.relationship(
        'Transaction',
        foreign_keys='Transaction.seller_id',
        back_populates='seller', 
        lazy=True
    )

    sent_messages = db.relationship('ChatMessage', back_populates='sender', lazy=True)

@event.listens_for(User.password, 'set', retval=True)
def hash_password(target, value, oldvalue, initiator):
    if value != oldvalue:
        return generate_password_hash(value)
    return value