import { fromUnits } from "@ston-fi/sdk";
import { stonApiClient } from "@/lib/ston-api-client";

const StakingStatsContainer = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
    {children}
  </div>
);

interface StatCardProps {
  label: React.ReactNode;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 4, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#111' }}>{value}</div>
    </div>
  );
}

export async function StakingStatsContent() {
  const stats = await stonApiClient.getStakingStats();

  return (
    <StakingStatsContainer>
      <StatCard label={<>STON Price <small style={{ fontWeight: 400, color: '#aaa' }}>(USD)</small></>} value={`$${Number(stats.stonPriceUsd).toFixed(4)}`} />
      <StatCard label={<>STON <small style={{ fontWeight: 400, color: '#aaa' }}>Total supply</small></>} value={parseFloat(fromUnits(BigInt(stats.stonTotalSupply))).toLocaleString('en-US', { maximumFractionDigits: 0 })} />
      <StatCard label={<>STON <small style={{ fontWeight: 400, color: '#aaa' }}>Total staked</small></>} value={parseFloat(fromUnits(BigInt(stats.totalStakedSton))).toLocaleString('en-US', { maximumFractionDigits: 0 })} />
      <StatCard label={<>GEMSTON <small style={{ fontWeight: 400, color: '#aaa' }}>Supply</small></>} value={parseFloat(fromUnits(BigInt(stats.gemstonTotalSupply))).toLocaleString('en-US', { maximumFractionDigits: 0 })} />
    </StakingStatsContainer>
  );
}

export function StakingStatsFallback() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="card" style={{ padding: '16px 20px', height: 80, background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      ))}
    </div>
  );
}