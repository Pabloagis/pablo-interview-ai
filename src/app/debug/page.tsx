export default function DebugPage() {
  return (
    <div style={{padding: '20px', fontFamily: 'monospace', fontSize: '12px'}}>
      <p>Test 1 - plain div 100%:</p>
      <div style={{width: '100%', height: '20px', background: 'red'}}></div>
      <p>Test 2 - plain div 100vw:</p>
      <div style={{width: '100vw', height: '20px', background: 'blue'}}></div>
      <p>Test 3 - tailwind w-full:</p>
      <div className="w-full" style={{height: '20px', background: 'green'}}></div>
      <p>If red and green bars reach edge to edge but blue overflows = 100vw is the bug</p>
    </div>
  );
}
