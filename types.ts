export enum Sender {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  timestamp: Date;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}