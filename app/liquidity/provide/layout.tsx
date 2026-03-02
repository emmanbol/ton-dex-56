export default function LiquidityProvideLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', width: '100%' }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', margin: '0 0 4px' }}>Liquidity Pools</h1>
        <p style={{ fontSize: 14, color: '#888', margin: 0 }}>
          Provide liquidity to earn trading fees on every swap through your pool.
        </p>
      </div>
      {children}
    </div>
  );
}