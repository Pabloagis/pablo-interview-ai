import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

// Lazy singleton — avoids errors if ANTHROPIC_API_KEY is not set during build
export function getAnthropicClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
    _client = new Anthropic({ apiKey });
  }
  return _client;
}
