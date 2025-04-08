import io from 'socket.io-client';
import client from '@/api/client';

const socket = io(client.defaults.baseURL, {
  transports: ['websocket']
});

export default socket;