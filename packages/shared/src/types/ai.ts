export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

export interface AiSession {
  id: string;
  userId: string;
  model: string;
  messages: ChatMessage[];
  createdAt: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
}

export interface ChatResponse {
  model: string;
  response: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}
