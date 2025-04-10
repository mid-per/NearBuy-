from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user_model import User
from app.models.listing_model import Transaction
from app.models.chat_model import ChatRoom, ChatMessage
from datetime import datetime, timezone
import uuid
from app.models.listing_model import Listing, Transaction
from functools import wraps

bp = Blueprint('chat', __name__, url_prefix='/api/chats')

def verify_chat_participant(f):
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        current_user_id = int(get_jwt_identity())
        room = ChatRoom.query.get(kwargs['room_id'])
        
        if not room or (current_user_id not in [room.transaction.buyer_id, room.transaction.seller_id]):
            return jsonify({"error": "Not authorized"}), 403
            
        return f(*args, **kwargs)
    return decorated_function

@bp.route('/initiate', methods=['POST'])
@jwt_required()
def initiate_chat():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    print(f"Initiate chat request from user {current_user_id} with data: {data}")  # Debug log
    
    if not data or 'listing_id' not in data:
        print("Missing listing_id in request")  # Debug log
        return jsonify({"error": "Listing ID required"}), 400

    try:
        listing = Listing.query.get(data['listing_id'])
        if not listing:
            print(f"Listing not found: {data['listing_id']}")  # Debug log
            return jsonify({"error": "Listing not found"}), 404

        if listing.seller_id == current_user_id:
            print("User tried to chat with themselves")  # Debug log
            return jsonify({"error": "Cannot create chat with yourself"}), 403

        # Check for existing transaction or create new
        transaction = Transaction.query.filter_by(
            listing_id=listing.id,
            buyer_id=current_user_id
        ).first()

        if not transaction:
            print("Creating new transaction")  # Debug log
            transaction = Transaction(
                qr_code=f"nearbuy:{uuid.uuid4().hex}",
                seller_id=listing.seller_id,
                buyer_id=current_user_id,
                listing_id=listing.id
            )
            db.session.add(transaction)
            db.session.commit()
            print(f"Created new transaction: {transaction.id}")  # Debug log

        # Get or create chat room
        if not transaction.chat_room:
            print("Creating new chat room")  # Debug log
            new_room = ChatRoom(
                transaction_id=transaction.id,
                listing_id=listing.id
            )
            db.session.add(new_room)
            db.session.commit()
            transaction.chat_room = new_room
            print(f"Created new chat room: {new_room.id}")  # Debug log

        return jsonify({
            "room_id": transaction.chat_room.id,
            "transaction_id": transaction.id,
            "listing_id": listing.id,
            "seller_id": listing.seller_id
        }), 200

    except Exception as e:
        print(f"Error in initiate_chat: {str(e)}")  # Debug log
        db.session.rollback()
        return jsonify({"error": "Failed to initiate chat", "details": str(e)}), 500
    
@bp.route('/', methods=['GET'])
@jwt_required()
def get_user_chats():
    current_user_id = int(get_jwt_identity())
    
    # Get all chat rooms where user is either buyer or seller
    chats = db.session.query(
        ChatRoom,
        Listing.title.label('listing_title')
    ).join(
        Transaction,
        Transaction.id == ChatRoom.transaction_id
    ).join(
        Listing,
        Listing.id == ChatRoom.listing_id
    ).filter(
        (Transaction.buyer_id == current_user_id) |
        (Transaction.seller_id == current_user_id)
    ).all()
    
    # Get last message for each chat
    result = []
    for chat, listing_title in chats:
        last_msg = ChatMessage.query.filter_by(room_id=chat.id)\
            .order_by(ChatMessage.sent_at.desc()).first()
            
        result.append({
            'id': chat.id,
            'listing_id': chat.listing_id,
            'listing_title': listing_title,
            'seller_id': chat.transaction.seller_id,
            'last_message': last_msg.content if last_msg else None,
            'last_message_time': last_msg.sent_at.isoformat() if last_msg else None
        })
    
    return jsonify({'chats': result}), 200

@bp.route('/<int:transaction_id>', methods=['GET'])
@jwt_required()
def get_or_create_chat(transaction_id):
    current_user = User.query.get(int(get_jwt_identity()))
    
    # Verify transaction exists and user is participant
    transaction = Transaction.query.filter(
        (Transaction.id == transaction_id) &
        ((Transaction.buyer_id == current_user.id) | 
         (Transaction.seller_id == current_user.id))
    ).first()
    
    if not transaction:
        return jsonify({"error": "Transaction not found"}), 404
    
    # Get or create chat room
    if not transaction.chat_room:
        new_room = ChatRoom(transaction_id=transaction_id)
        db.session.add(new_room)
        db.session.commit()
        transaction.chat_room = new_room
    
    return jsonify({
        "room_id": transaction.chat_room.id,
        "transaction_id": transaction.id
    }), 200

@bp.route('/<int:room_id>/messages', methods=['GET'])
@jwt_required()
@verify_chat_participant
def get_messages(room_id):
    current_user = User.query.get(int(get_jwt_identity()))
    
    room = ChatRoom.query.get(room_id)
    if not room:
        return jsonify({"error": "Chat room not found"}), 404
    
    # Verify user is participant
    if current_user.id not in [room.transaction.buyer_id, room.transaction.seller_id]:
        return jsonify({"error": "Not authorized"}), 403
    
    messages = ChatMessage.query.filter_by(room_id=room_id)\
        .order_by(ChatMessage.sent_at.asc()).all()
    
    return jsonify({
        "listing": {
            "id": room.listing.id,
            "title": room.listing.title,
            "price": room.listing.price,
            "image_url": room.listing.image_url
        },
        "messages": [{
            "id": msg.id,
            "content": msg.content,
            "sender_id": msg.sender_id,
            "sent_at": msg.sent_at.isoformat(),
            "is_read": msg.read_at is not None,
            "is_current_user": msg.sender_id == current_user.id
        } for msg in messages]
    }), 200

@bp.route('/<int:room_id>/messages', methods=['POST'])
@jwt_required()
@verify_chat_participant
def send_message(room_id):
    current_user = User.query.get(int(get_jwt_identity()))
    data = request.get_json()
    
    if not data or 'content' not in data:
        return jsonify({"error": "Message content required"}), 400
    
    room = ChatRoom.query.get(room_id)
    if not room:
        return jsonify({"error": "Chat room not found"}), 404
    
    # Verify user is participant
    if current_user.id not in [room.transaction.buyer_id, room.transaction.seller_id]:
        return jsonify({"error": "Not authorized"}), 403
    
    new_message = ChatMessage(
        room_id=room_id,
        sender_id=current_user.id,
        content=data['content'].strip()
    )
    
    db.session.add(new_message)
    db.session.commit()
    
    return jsonify({
        "message": "Message sent",
        "message_id": new_message.id
    }), 201