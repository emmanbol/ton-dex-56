import { Suspense } from "react";
import { StakingStatsContent, StakingStatsFallback } from "./components/stake-stats";

export default function StakeLayout({ children }: { children: React.ReactNode }) {
  return (
    <section style={{ maxWidth: 900, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg,#0098EA,#7B61FF)', borderRadius: 20, padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -40, right: 100, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginBottom: 4, fontWeight: 500 }}>Stake STON</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'white', marginBottom: 2 }}>Earn rewards &amp; NFTs</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)' }}>Lock STON to earn GEMSTON tokens and soul-bound ARKENSTON NFTs</div>
        </div>
      </div>

      {/* Live stats */}
      <Suspense fallback={<StakingStatsFallback />}>
        <StakingStatsContent />
      </Suspense>

      {children}
    </section>
  );
}
