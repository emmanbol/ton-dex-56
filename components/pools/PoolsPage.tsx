'use client';

import { useState } from 'react';
import { useTonWallet, useTonConnectUI } from '@tonconnect/ui-react';
import toast from 'react-hot-toast';
import { DoubleTokenIcon, StatCard, Skeleton, fmtMoney, fmtNumber } from '@/components/ui/index';
import { Icons } from '@/components/ui/Icons';
import { usePools } from '@/hooks/useStonfi';
import { toNano, ROUTER_V2 } from '@/lib/stonfi';
import type { Pool } from '@/types';

// ─── Add Liquidity Modal ──────────────────────────────────────────────────────
function AddLiquidityModal({ pool, onClose }: { pool: Pool; onClose: () => void }) {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const [amt0, setAmt0] = useState('');
  const [adding, setAdding] = useState(false);
  const [done, setDone] = useState(false);

  const ratio = pool.token0.price && pool.token1.price
    ? pool.token0.price / pool.token1.price : 1;
  const amt1 = amt0 ? (parseFloat(amt0) * ratio).toFixed(6) : '';
  const sharePercent = amt0 && pool.tvl > 0
    ? Math.min((parseFloat(amt0) * (pool.token0.price || 0) / pool.tvl) * 100, 100).toFixed(4)
    : '0';

  const handleAdd = async () => {
    if (!amt0 || !wallet) return;
    setAdding(true);
    try {
      /*
       * ── Production provide_lp with @ston-fi/sdk v2 ──────────────────────
       *
       *   import { DEX, pTON } from '@ston-fi/sdk';
       *   import { TonClient } from '@ton/ton';
       *
       *   const client = new TonClient({ endpoint: 'https://toncenter.com/api/v2/jsonRPC' });
       *   const router = client.open(DEX.v2_2.Router.create(pool.routerAddress ?? ROUTER_V2));
       *
       *   // For TON + Jetton pool:
       *   const txParams = await router.getProvideLiquidityTonTxParams({
       *     userWalletAddress: wallet.account.address,
       *     proxyTon:          pTON.v2_1.create(PTON_V2),
       *     sendTokenAddress:  pool.token1.address,
       *     sendAmount:        toNano(amt1, pool.token1.decimals),
       *     minLpOut:          '1',
       *   });
       *
       *   // For Jetton + Jetton pool:
       *   const txParams = await router.getProvideLiquidityJettonTxParams({
       *     userWalletAddress:   wallet.account.address,
       *     sendTokenAddress:    pool.token0.address,
       *     sendAmount:          toNano(amt0, pool.token0.decimals),
       *     otherTokenAddress:   pool.token1.address,
       *     minLpOut:            '1',
       *   });
       *
       *   await tonConnectUI.sendTransaction({
       *     validUntil: Math.floor(Date.now() / 1000) + 600,
       *     messages: [{
       *       address: txParams.to.toString(),
       *       amount:  txParams.value.toString(),
       *       payload: txParams.body?.toBoc().toString('base64'),
       *     }],
       *   });
       * ──────────────────────────────────────────────────────────────────────
       * Placeholder: sends a minimal transfer to the router so the wallet
       * prompts. Replace with the block above for real liquidity provision.
       */
      const amountNano = toNano(amt0, pool.token0.decimals);

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
          address: ROUTER_V2,
          amount:  amountNano,
          // payload: txParams.body?.toBoc().toString('base64'),
        }],
      });
      setDone(true);
      toast.success('Liquidity transaction submitted!');
    } catch (err: any) {
      if (!err?.message?.includes('declined') && !err?.message?.includes('rejected')) {
        toast.error('Transaction failed');
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'white', borderRadius: 22, width: '100%', maxWidth: 450, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <DoubleTokenIcon t0={pool.token0} t1={pool.token1} size={32} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{pool.token0.symbol}/{pool.token1.symbol}</div>
              <div style={{ fontSize: 12, color: '#888' }}>Fee: {pool.fee}%</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#555' }}>{Icons.close}</button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Transaction Submitted!</div>
            <div style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>You are now earning {pool.apr.toFixed(1)}% APR</div>
            <button onClick={onClose} style={{ padding: '12px 32px', background: 'linear-gradient(135deg,#0098EA,#0077BB)', color: 'white', border: 'none', borderRadius: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 15 }}>Done</button>
          </div>
        ) : (
          <>
            {[
              { token: pool.token0, value: amt0, onChange: setAmt0, readonly: false },
              { token: pool.token1, value: amt1, onChange: undefined,  readonly: true  },
            ].map(({ token, value, onChange, readonly }, i) => (
              <div key={i} style={{ background: '#f7f9fc', borderRadius: 14, padding: '12px 14px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#888' }}>Token {i + 1}</span>
                  <span style={{ fontSize: 12, color: '#0098EA' }}>Balance: {token.balance || '0.00'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                    {token.symbol}
                  </div>
                  {readonly ? (
                    <div style={{ flex: 1, textAlign: 'right', fontSize: 20, fontWeight: 700, color: value ? '#111' : '#ccc' }}>{value || '0.00'}</div>
                  ) : (
                    <input type="number" value={value} onChange={(e) => onChange?.(e.target.value)} placeholder="0.00"
                      style={{ flex: 1, textAlign: 'right', border: 'none', background: 'none', fontSize: 20, fontWeight: 700, color: value ? '#111' : '#ccc', outline: 'none', fontFamily: 'inherit' }} />
                  )}
                </div>
              </div>
            ))}

            <div style={{ background: '#f0f9ff', borderRadius: 12, padding: 12, marginBottom: 14, fontSize: 12 }}>
              {[
                { label: 'Pool share',   value: `${sharePercent}%`,         color: '#111' },
                { label: 'APR',          value: `${pool.apr.toFixed(1)}%`,  color: '#22C55E' },
                { label: 'TVL',          value: fmtMoney(pool.tvl),          color: '#111' },
                { label: 'Network fee',  value: '~0.4 TON',                  color: '#111' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#666' }}>{label}</span>
                  <span style={{ color, fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleAdd}
              disabled={!amt0 || adding || !wallet}
              style={{ width: '100%', padding: 14, background: !amt0 || !wallet ? '#f0f2f5' : 'linear-gradient(135deg,#0098EA,#0077BB)', color: !amt0 || !wallet ? '#aaa' : 'white', border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: amt0 && wallet ? 'pointer' : 'default', fontFamily: 'inherit' }}
            >
              {adding ? 'Submitting...' : !wallet ? 'Connect wallet' : !amt0 ? 'Enter an amount' : 'Add Liquidity'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Pools Page ───────────────────────────────────────────────────────────────
export function PoolsPage() {
  const wallet = useTonWallet();
  const connected = !!wallet;
  const { pools, isLoading } = usePools();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'tvl' | 'volume24h' | 'apr'>('tvl');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);

  const FILTERS = ['All', 'My pools', 'Farming', 'Stable'];

  const filtered = pools
    .filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        p.token0.symbol.toLowerCase().includes(q) ||
        p.token1.symbol.toLowerCase().includes(q);
      const matchFilter =
        activeFilter === 'All' ||
        (activeFilter === 'Farming' && p.isFarming) ||
        (activeFilter === 'Stable'  && p.isStable)  ||
        (activeFilter === 'My pools' && p.myLiquidity);
      return matchSearch && matchFilter;
    })
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const totalTVL = pools.reduce((s, p) => s + (p.tvl || 0), 0);
  const totalVol = pools.reduce((s, p) => s + (p.volume24h || 0), 0);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {selectedPool && <AddLiquidityModal pool={selectedPool} onClose={() => setSelectedPool(null)} />}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Value Locked" value={isLoading ? '...' : fmtMoney(totalTVL)} />
        <StatCard label="24h Volume"          value={isLoading ? '...' : fmtMoney(totalVol)} />
        <StatCard label="Total Pools"         value={isLoading ? '...' : String(pools.length)} />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #f0f2f5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111' }}>Liquidity Pools</h2>
            <button
              onClick={() => connected ? setSelectedPool(pools[0] ?? null) : toast.error('Connect wallet first')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'linear-gradient(135deg,#0098EA,#0077BB)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 12px rgba(0,152,234,.3)' }}
            >
              + Add Liquidity
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }}>{Icons.search}</span>
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pools..."
                style={{ width: '100%', padding: '9px 12px 9px 32px', border: '1.5px solid #eee', borderRadius: 12, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                onFocus={(e) => { e.target.style.borderColor = '#0098EA'; }}
                onBlur={(e)  => { e.target.style.borderColor = '#eee'; }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {FILTERS.map((f) => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  style={{ padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${activeFilter === f ? '#0098EA' : '#eee'}`, background: activeFilter === f ? '#EFF6FF' : 'white', color: activeFilter === f ? '#0098EA' : '#666', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                >{f}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 120px', gap: 8, padding: '10px 20px', background: '#fafbfc', borderBottom: '1px solid #f0f2f5' }}>
          {([['Pool', null], ['TVL', 'tvl'], ['24h Volume', 'volume24h'], ['APR', 'apr'], ['Action', null]] as [string, string | null][]).map(([label, key]) => (
            <div key={label}
              onClick={() => key && setSortBy(key as 'tvl' | 'volume24h' | 'apr')}
              style={{ fontSize: 12, color: sortBy === key ? '#0098EA' : '#888', fontWeight: 600, cursor: key ? 'pointer' : 'default', userSelect: 'none' }}
            >
              {label} {key && sortBy === key && '↓'}
            </div>
          ))}
        </div>

        {/* Rows */}
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ padding: '16px 20px', borderBottom: '1px solid #f8f9fa', display: 'flex', gap: 12, alignItems: 'center' }}>
              <Skeleton w={60} h={36} rounded={18} />
              <div style={{ flex: 1, display: 'flex', gap: 12 }}>
                {[1,2,3,4].map((j) => <Skeleton key={j} h={16} />)}
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#aaa' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>No pools found</div>
          </div>
        ) : (
          filtered.map((pool, i) => (
            <div key={pool.address}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 120px', gap: 8, padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid #f8f9fa' : 'none', alignItems: 'center', transition: 'background .15s' }}
              onMouseOver={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#fafbfc'; }}
              onMouseOut={(e)  => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <DoubleTokenIcon t0={pool.token0} t1={pool.token1} size={32} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{pool.token0.symbol}/{pool.token1.symbol}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: '#f0f2f5', color: '#666', fontWeight: 600 }}>Fee {pool.fee}%</span>
                    {pool.isStable && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: '#EFF6FF', color: '#0098EA', fontWeight: 600 }}>Stable</span>}
                    {pool.apr > 40 && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: '#FFF7ED', color: '#F59E0B', fontWeight: 600 }}>🔥 Hot</span>}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{fmtMoney(pool.tvl)}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{fmtMoney(pool.volume24h)}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#22C55E' }}>{fmtNumber(pool.apr)}%</div>
              <button
                onClick={() => connected ? setSelectedPool(pool) : toast.error('Connect wallet first')}
                style={{ padding: '7px 14px', background: 'linear-gradient(135deg,#0098EA,#0077BB)', color: 'white', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
              >
                + Add
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}