'use client';

import { useState } from 'react';

export default function DebugPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [detail, setDetail] = useState('');

  const sendTestEmail = async () => {
    setStatus('sending');
    setDetail('');
    try {
      const res = await fetch('/api/test-followup', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setStatus('ok');
        setDetail(`emailId: ${data.emailId}`);
      } else {
        setStatus('error');
        setDetail(data.error || 'Unknown error');
      }
    } catch (err) {
      setStatus('error');
      setDetail(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', fontSize: '14px', maxWidth: '500px' }}>
      <h2 style={{ marginBottom: '24px' }}>Follow-up email test</h2>

      <p style={{ marginBottom: '16px', color: '#64748b', fontSize: '12px' }}>
        Sends a sample conversation (CSM role at TravelTech SaaS) to{' '}
        <strong>pabloagisburgos@gmail.com</strong> via Resend + Claude Haiku analysis.
      </p>

      <button
        onClick={sendTestEmail}
        disabled={status === 'sending'}
        style={{
          padding: '10px 20px',
          background: status === 'sending' ? '#94a3b8' : '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: status === 'sending' ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontFamily: 'monospace',
        }}
      >
        {status === 'sending' ? 'Sending…' : 'Send test email'}
      </button>

      {status === 'ok' && (
        <p style={{ marginTop: '16px', color: '#166534' }}>
          ✓ Sent — check pabloagisburgos@gmail.com
          <br />
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{detail}</span>
        </p>
      )}

      {status === 'error' && (
        <p style={{ marginTop: '16px', color: '#dc2626' }}>
          ✗ Error: {detail}
        </p>
      )}
    </div>
  );
}
