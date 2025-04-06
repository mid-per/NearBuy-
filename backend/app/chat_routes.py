from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user_model import User
from app.models.listing_model import Transaction
from app.models.chat_model import ChatRoom, ChatMessage
from datetime import datetime, timezone

bp = Blueprint('chat', __name__, url_prefix='/api/chats')

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
    
    return jsonify([{
        "id": msg.id,
        "content": msg.content,
        "sender_id": msg.sender_id,
        "sent_at": msg.sent_at.isoformat(),
        "is_read": msg.read_at is not None
    } for msg in messages]), 200

@bp.route('/<int:room_id>/messages', methods=['POST'])
@jwt_required()
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