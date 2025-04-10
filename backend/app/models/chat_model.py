from app import db
from datetime import datetime, timezone

class ChatRoom(db.Model):
    __tablename__ = 'chat_rooms'
    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id'))
    listing_id = db.Column(db.Integer, db.ForeignKey('listings.id'))  # Add this line
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    transaction = db.relationship('Transaction', back_populates='chat_room')
    listing = db.relationship('Listing')  # Add this relationship
    messages = db.relationship('ChatMessage', back_populates='room')

class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey('chat_rooms.id'))
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    content = db.Column(db.Text, nullable=False)
    sent_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    read_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    room = db.relationship('ChatRoom', back_populates='messages')
    sender = db.relationship('User', back_populates='sent_messages')