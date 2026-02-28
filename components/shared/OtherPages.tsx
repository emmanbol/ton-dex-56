'use client';

import { useState } from 'react';
import { useTonWallet } from '@tonconnect/ui-react';
import toast from 'react-hot-toast';
import { TokenIcon, fmtMoney } from '@/components/ui/index';

// ─── Spotlight Page ───────────────────────────────────────────────────────────
export function SpotlightPage() {
  const FEATURED = [
    { name: 'NOT/TON Farm', token: 'NOT', desc: 'Farm Notcoin with boosted rewards from TON Foundation', apr: 142, tvl: 1_200_000, badge: '🔥 Hot', endsIn: '5 days', color: '#F5A623' },
    { name: 'GRAM Genesis Pool', token: 'GRAM', desc: 'Participate in the GRAM launch liquidity program', apr: 89, tvl: 890_000, badge: '🆕 New', endsIn: '12 days', color: '#8B5CF6' },
    { name: 'BOLT/TON Boost', token: 'BOLT', desc: 'Volatile pair with massive liquidity mining rewards', apr: 215, tvl: 340_000, badge: '⚡ Boosted', endsIn: '3 days', color: '#EF4444' },
    { name: 'STON LP Rewards', token: 'STON', desc: 'Earn extra STON by providing liquidity to STON pairs', apr: 55, tvl: 6_400_000, badge: '⭐ Official', endsIn: '30 days', color: '#2E86AB' },
  ];

  const wallet = useTonWallet();

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81,#1e1b4b)', borderRadius: 20, padding: '32px', marginBottom: 24, color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(123,97,255,.2)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <svg width="24" height="24" viewBox="0 0 24 24"><path d="M12 2l2.4 7.2H22l-6.2 4.5 2.4 7.3L12 17l-6.2 4 2.4-7.3L2 9.2h7.6z" fill="#FFD700"/></svg>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>Spotlight</h1>
          <span style={{ background: '#0098EA', fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 700 }}>New</span>
        </div>
        <p style={{ margin: 0, color: 'rgba(255,255,255,.7)', fontSize: 15, maxWidth: 500 }}>
          Curated farms and incentive programs with enhanced rewards. Vetted by the STON.fi team and TON Foundation.
        </p>
      </div>

      {/* Featured grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {FEATURED.map((item) => (
          <div key={item.name} style={{ background: 'white', borderRadius: 20, padding: 22, boxShadow: '0 4px 20px rgba(0,0,0,.07)', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '0 20px 0 80px', background: `${item.color}15` }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <TokenIcon token={item.token} size={48} />
              <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: '#FFF7ED', color: '#F59E0B', fontWeight: 700 }}>{item.badge}</span>
            </div>

            <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#111' }}>{item.name}</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#888', lineHeight: 1.5 }}>{item.desc}</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, padding: '12px 14px', background: '#f7f9fc', borderRadius: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>APR</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#22C55E' }}>{item.apr}%</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>TVL</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{fmtMoney(item.tvl)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>Ends in</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F59E0B' }}>{item.endsIn}</div>
              </div>
            </div>

            <button
              onClick={() => wallet ? toast.success(`Navigating to ${item.name}...`) : toast.error('Connect wallet first')}
              style={{ width: '100%', padding: '12px 0', background: 'linear-gradient(135deg,#0098EA,#0077BB)', color: 'white', border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(0,152,234,.3)' }}
            >
              Farm Now
            </button>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div style={{ marginTop: 24, padding: '16px 20px', background: 'rgba(0,152,234,0.07)', borderRadius: 14, border: '1.5px solid rgba(0,152,234,0.15)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 20 }}>ℹ️</span>
        <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>
          <strong style={{ color: '#0098EA' }}>What is Spotlight?</strong> Featured programs are incentive campaigns co-funded by project teams and the TON Foundation. APRs are variable and depend on TVL. Always DYOR before participating.
        </div>
      </div>
    </div>
  );
}

// ─── DAO Page ─────────────────────────────────────────────────────────────────
export function DAOPage() {
  const wallet = useTonWallet();
  const [voted, setVoted] = useState<Record<number, 'yes' | 'no'>>({});

  const PROPOSALS = [
    { id: 1, title: 'Increase USDT/TON pool trading fee to 0.5%', description: 'Proposal to adjust the USDT/TON pool fee from 0.3% to 0.5% to better reflect market conditions and increase protocol revenue.', status: 'Active' as const, yes: 67, no: 33, ends: '3 days left', quorum: 72 },
    { id: 2, title: 'Add BOLT/USDT liquidity pool', description: 'Create a new trading pair for BOLT and USDT with a 0.3% fee structure to expand protocol offerings.', status: 'Active' as const, yes: 82, no: 18, ends: '5 days left', quorum: 48 },
    { id: 3, title: 'Treasury allocation Q1 2026 — Development fund', description: 'Allocate 500,000 STON from treasury to fund development initiatives in Q1 2026.', status: 'Passed' as const, yes: 91, no: 9, ends: 'Ended Jan 15', quorum: 91 },
    { id: 4, title: 'Reduce minimum STON staking amount to 10 STON', description: 'Lower the minimum staking threshold from 100 STON to 10 STON to improve accessibility.', status: 'Failed' as const, yes: 41, no: 59, ends: 'Ended Jan 10', quorum: 41 },
    { id: 5, title: 'Enable cross-chain bridge for ETH/TON swaps', description: 'Integrate with LayerZero to enable trustless bridging between Ethereum and TON ecosystems.', status: 'Active' as const, yes: 54, no: 46, ends: '8 days left', quorum: 31 },
  ];

  const handleVote = (id: number, vote: 'yes' | 'no') => {
    if (!wallet) { toast.error('Connect wallet to vote'); return; }
    setVoted((prev) => ({ ...prev, [id]: vote }));
    toast.success(`Vote cast: ${vote === 'yes' ? '✅ Yes' : '❌ No'}`);
  };

  const statusStyles: Record<string, { bg: string; color: string }> = {
    Active: { bg: '#EFF6FF', color: '#0098EA' },
    Passed: { bg: '#F0FDF4', color: '#16A34A' },
    Failed: { bg: '#FEF2F2', color: '#DC2626' },
  };

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800, color: '#111' }}>DAO Governance</h1>
          <p style={{ margin: 0, fontSize: 14, color: '#888' }}>Vote on proposals with your staked STON. 1 STON = 1 vote.</p>
        </div>
        <button
          onClick={() => wallet ? toast('Proposal creation coming soon!') : toast.error('Connect wallet first')}
          style={{ padding: '10px 18px', background: 'linear-gradient(135deg,#0098EA,#0077BB)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          + Create Proposal
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Active Proposals', value: PROPOSALS.filter(p => p.status === 'Active').length },
          { label: 'Total Proposals', value: PROPOSALS.length },
          { label: 'Your Voting Power', value: wallet ? '0 STON' : '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: 'white', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#111' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Proposals */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {PROPOSALS.map((p) => {
          const myVote = voted[p.id];
          return (
            <div key={p.id} style={{ background: 'white', borderRadius: 18, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1, marginRight: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 700, background: statusStyles[p.status].bg, color: statusStyles[p.status].color }}>{p.status}</span>
                    <span style={{ fontSize: 12, color: '#aaa' }}>{p.ends}</span>
                  </div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#111' }}>{p.title}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: '#888', lineHeight: 1.5 }}>{p.description}</p>
                </div>
                {p.status === 'Active' && !myVote && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => handleVote(p.id, 'yes')} style={{ padding: '8px 14px', background: '#F0FDF4', color: '#16A34A', border: '1.5px solid #BBF7D0', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>✓ Yes</button>
                    <button onClick={() => handleVote(p.id, 'no')} style={{ padding: '8px 14px', background: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FECACA', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>✗ No</button>
                  </div>
                )}
                {myVote && (
                  <div style={{ padding: '8px 14px', background: myVote === 'yes' ? '#F0FDF4' : '#FEF2F2', color: myVote === 'yes' ? '#16A34A' : '#DC2626', borderRadius: 10, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                    Voted: {myVote === 'yes' ? '✓ Yes' : '✗ No'}
                  </div>
                )}
              </div>

              {/* Vote bar */}
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', height: 8 }}>
                  <div style={{ width: `${p.yes}%`, background: 'linear-gradient(90deg,#22C55E,#16A34A)' }} />
                  <div style={{ width: `${p.no}%`, background: 'linear-gradient(90deg,#EF4444,#DC2626)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12 }}>
                  <span><span style={{ color: '#16A34A', fontWeight: 700 }}>Yes {p.yes}%</span></span>
                  <span style={{ color: '#aaa' }}>Quorum: {p.quorum}%</span>
                  <span><span style={{ color: '#EF4444', fontWeight: 700 }}>No {p.no}%</span></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
