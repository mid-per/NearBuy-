export interface ChatMessage {
  id: string;
  text: string;
  senderId: number;
  timestamp: Date;
  isCurrentUser: boolean;
}

export interface ChatRoom {
  id: number;
  transactionId: number;
  listingId: number;
  createdAt: Date;
}

export interface SocketMessage {
  id: string;
  content: string;
  sender_id: number;
  timestamp: string;
}