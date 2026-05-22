export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface Session {
  id: string;
  recruiterName?: string;
  company?: string;
  role?: string;
  createdAt: string;
  messages: AnthropicMessage[];
}

export interface RecruiterContext {
  recruiterName?: string;
  company?: string;
  role?: string;
  email?: string;
  consentToEmail?: boolean;
  tone?: 'formal' | 'warm' | 'technical' | 'commercial';
  language?: 'en' | 'es' | 'it' | 'pt';
}

export interface ChatRequest {
  message: string;
  sessionId: string;
  context: RecruiterContext;
  autoIntro?: boolean;
  autoCheckIn?: boolean;
}

export interface SessionCreateRequest {
  recruiterName?: string;
  company?: string;
  role?: string;
  email?: string;
  consentToEmail?: boolean;
}

export interface SessionCreateResponse {
  sessionId: string;
  createdAt: string;
}

export interface MemorySearchResult {
  id: string;
  content: string;
  type: string;
  similarity: number;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

// Matches the Anthropic API message format exactly
export type AnthropicMessage = {
  role: 'user' | 'assistant';
  content: string;
};
