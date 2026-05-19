export function generateId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  // Fallback for environments where crypto is unavailable
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

export function formatTimestamp(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function parseSSELine(line: string): object | null {
  if (!line.startsWith('data: ')) return null;
  try {
    return JSON.parse(line.slice(6));
  } catch {
    return null;
  }
}

// List of personal email domains to block
export const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com', 'googlemail.com',
  'hotmail.com', 'hotmail.es', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.it',
  'outlook.com', 'outlook.es', 'outlook.co.uk', 'live.com', 'live.es',
  'yahoo.com', 'yahoo.es', 'yahoo.co.uk', 'yahoo.fr', 'yahoo.it', 'ymail.com',
  'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me',
  'aol.com', 'aim.com',
  'mail.com', 'gmx.com', 'gmx.es', 'gmx.de',
  'zoho.com', 'fastmail.com',
  'tutanota.com', 'tuta.io',
  'pm.me',
  'msn.com',
];

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isPersonalEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return PERSONAL_EMAIL_DOMAINS.includes(domain);
}
