from flask_socketio import SocketIO, emit, join_room
from app import db
from app.models.chat_model import ChatMessage
from datetime import datetime, timezone

socketio = SocketIO(async_mode='eventlet', cors_allowed_origins="*")

def init_socketio(app):
    socketio.init_app(app)
    return socketio

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('join')
def handle_join(data):
    join_room(data['room_id'])
    print(f"Client joined room {data['room_id']}")

@socketio.on('send_message')
def handle_message(data):
    print(f"Received message: {data}")  # Debug log
    new_msg = ChatMessage(
        room_id=data['room_id'],
        sender_id=data['user_id'],
        content=data['content']
    )
    db.session.add(new_msg)
    db.session.commit()
    
    emit('new_message', {
        'id': new_msg.id,
        'content': data['content'],
        'sender_id': data['user_id'],
        'timestamp': datetime.now(timezone.utc).isoformat()
    }, room=data['room_id'], include_self=True)  # Key change: include_self