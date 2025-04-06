from app import db

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)  # True = admin, False = customer

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

    sent_messages = db.relationship('ChatMessage', back_populates='sender')