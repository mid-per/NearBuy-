from flask_socketio import SocketIO, emit, join_room
from app import db
from app.models.chat_model import ChatMessage
from datetime import datetime, timezone

# Create uninitialized SocketIO instance
socketio = SocketIO(cors_allowed_origins="*", async_mode='threading')

def init_socketio(app):
    # Initialize with app and register handlers
    socketio.init_app(app)
    register_handlers()
    return socketio

def register_handlers():
    @socketio.on('connect')
    def handle_connect():
        print('Client connected')

    @socketio.on('disconnect')
    def handle_disconnect():
        print('Client disconnected')

    @socketio.on('join')
    def handle_join(data):
        join_room(data['room_id'])
        print(f"Client joined room {data['room_id']}")

    @socketio.on('send_message')
    def handle_message(data):
        try:
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
            }, room=data['room_id'])
        except Exception as e:
            print(f"Error handling message: {str(e)}")
            emit('error', {'message': str(e)})