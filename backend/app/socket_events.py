from flask_socketio import SocketIO, emit, join_room
from app import db
from app.models.chat_model import ChatMessage
from datetime import datetime, timezone
from typing import Any, Dict

# Create uninitialized SocketIO instance
socketio = SocketIO(cors_allowed_origins="*", async_mode='threading')

def init_socketio(app):
    """Initialize SocketIO with the Flask app and register handlers."""
    socketio.init_app(app)
    _register_handlers()
    return socketio

def _register_handlers() -> None:

    @socketio.on('connect')
    def _handle_connect() -> None:
        print('Client connected')

    @socketio.on('disconnect')
    def _handle_disconnect() -> None:
        print('Client disconnected')

    @socketio.on('join')
    def _handle_join(data: Dict[str, Any]) -> None:
        if (room_id := data.get('room_id')):
            join_room(f'room_{room_id}')
            print(f"Client joined room {room_id}")

    @socketio.on('send_message')
    def _handle_message(data: Dict[str, Any]) -> None:
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
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'room_id': data['room_id']
            }, room=f'room_{data["room_id"]}')
        except Exception as e:
            print(f"Error handling message: {str(e)}")
            emit('error', {'message': str(e)})

__all__ = ['socketio', 'init_socketio']