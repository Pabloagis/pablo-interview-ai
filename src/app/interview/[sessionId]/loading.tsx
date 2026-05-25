export default function Loading() {
  return (
    <>
      <style>{`
        @keyframes im-dot {
          0%, 80%, 100% { opacity: 0.2; transform: translateY(0) scale(0.85); }
          40%            { opacity: 0.9; transform: translateY(-4px) scale(1); }
        }
      `}</style>
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-base)',
      }}>
        <p style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 28,
        }}>
          InterviewMind
        </p>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 5, height: 5,
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              animation: `im-dot 1.1s ease-in-out ${i * 0.16}s infinite`,
            }} />
          ))}
        </div>
      </div>
    </>
  );
}
