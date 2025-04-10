export interface ChatMessage {
    id: string;
    text: string;
    senderId: number;
    timestamp: Date;
    isCurrentUser: boolean;
  }