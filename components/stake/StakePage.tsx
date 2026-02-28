'use client';

import { useState } from 'react';
import { useTonWallet, useTonConnectUI } from '@tonconnect/ui-react';
import toast from 'react-hot-toast';
import { TokenIcon, Toggle, Spinner, fmtNumber, fmtMoney } from '@/components/ui/index';
import { Icons } from '@/components/ui/Icons';
import { useAppStore } from '@/lib/store';
import { toNano, STAKING_ADDR } from '@/lib/stonfi';
import type { StakePosition } from '@/types';

const STAKING_OPTIONS = [
  { months: 1,  multiplier: 1.0, label: '1mo',  bonus: 0 },
  { months: 3,  multiplier: 1.5, label: '3mo',  bonus: 2 },
  { months: 6,  multiplier: 2.0, label: '6mo',  bonus: 5 },
  { months: 12, multiplier: 3.0, label: '1yr',  bonus: 8 },
  { months: 24, multiplier: 4.5, label: '2yr',  bonus: 10 },
];

const BASE_APR = 14.8;
const STON_PRICE = 0.21;
const TOTAL_STAKED = 24_800_000;

// ─── Stake NFT position card ─────────────────────────────────────────────────
function PositionCard({ pos, onClaim }: { pos: StakePosition; onClaim: (id: string) => void }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f5f5f5' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{fmtNumber(pos.amount, 2)} STON locked</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
            {pos.months} month{pos.months > 1 ? 's' : ''} · started {pos.startDate}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: '#22C55E', fontWeight: 700 }}>+{fmtNumber(pos.claimable, 4)} STON</div>
          <div style={{ fontSize: 11, color: '#aaa' }}>Claimable</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: '#f0f2f5', borderRadius: 8, height: 6, marginBottom: 8, overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(90deg,#0098EA,#7B61FF)', height: '100%', width: `${pos.progress}%`, borderRadius: 8, transition: 'width 1s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa', marginBottom: 12 }}>
        <span>{pos.progress}% complete</span>
        <span>{pos.months - Math.round(pos.months * pos.progress / 100)}mo remaining</span>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: '#FFFBEB', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>ARKENSTON</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#F59E0B' }}>{pos.arkenston}</div>
        </div>
        <div style={{ flex: 1, background: '#F5F3FF', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>GEMSTON</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#7C3AED' }}>{pos.gemston}</div>
        </div>
        <button
          onClick={() => onClaim(pos.id)}
          disabled={pos.claimable === 0}
          style={{ padding: '8px 14px', background: pos.claimable > 0 ? 'linear-gradient(135deg,#22C55E,#16A34A)' : '#f0f2f5', color: pos.claimable > 0 ? 'white' : '#aaa', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: pos.claimable > 0 ? 'pointer' : 'default', fontFamily: 'inherit' }}
        >
          Claim
        </button>
      </div>
    </div>
  );
}

// ─── Main Stake Page ──────────────────────────────────────────────────────────
export function StakePage() {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const connected = !!wallet;

  const { stakePositions, addStakePosition } = useAppStore();

  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake');
  const [stakeAmt, setStakeAmt] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(12);
  const [staking, setStaking] = useState(false);

  const opt = STAKING_OPTIONS.find((o) => o.months === selectedDuration) || STAKING_OPTIONS[3];
  const effectiveAPR = BASE_APR * opt.multiplier;
  const gemstoneReward = stakeAmt ? (parseFloat(stakeAmt) * opt.multiplier).toFixed(2) : '0';
  const estimatedReward = stakeAmt
    ? (parseFloat(stakeAmt) * (effectiveAPR / 100) * (selectedDuration / 12)).toFixed(4) : '0';
  const usdValue = stakeAmt ? (parseFloat(stakeAmt) * STON_PRICE).toFixed(2) : '0';

  const handleStake = async () => {
    if (!stakeAmt || !connected) return;
    setStaking(true);

    try {
      /*
       * Production staking with @ston-fi/stake-sdk:
       *
       *   import { StakeClient } from '@ston-fi/stake-sdk';
       *   const stakeClient = new StakeClient();
       *   const txParams = await stakeClient.buildStakeTx({
       *     userAddress:      wallet!.account.address,
       *     amount:           toNano(stakeAmt, 9),
       *     lockPeriodMonths: selectedDuration,
       *   });
       *   await tonConnectUI.sendTransaction({
       *     validUntil: Math.floor(Date.now() / 1000) + 600,
       *     messages: [{ address: txParams.to, amount: txParams.value, payload: txParams.payload }],
       *   });
       */
      // toNano handles decimals correctly: 1.5 STON → '1500000000'
      const amountNano = toNano(stakeAmt, 9); // STON = 9 decimals

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{ address: STAKING_ADDR, amount: amountNano }],
      });

      const newPos: StakePosition = {
        id: `stake-${Date.now()}`,
        amount: parseFloat(stakeAmt),
        months: selectedDuration,
        startDate: new Date().toISOString().split('T')[0],
        gemston: parseFloat(stakeAmt) * opt.multiplier,
        arkenston: parseFloat(stakeAmt) * opt.multiplier,
        claimable: 0,
        progress: 0,
      };

      addStakePosition(newPos);
      setStakeAmt('');
      toast.success(`Staked ${stakeAmt} STON for ${opt.label}!`);
    } catch (err: any) {
      if (!err?.message?.includes('declined')) toast.error('Staking failed. Try again.');
    } finally {
      setStaking(false);
    }
  };

  const handleClaim = async (posId: string) => {
    if (!connected) return;
    toast.success('Claim transaction sent!');
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg,#0098EA,#7B61FF)', borderRadius: 20, padding: '28px 32px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -40, right: 100, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginBottom: 4, fontWeight: 500 }}>Total STON Staked</div>
          <div style={{ fontSize: 38, fontWeight: 800, color: 'white', marginBottom: 2 }}>{fmtMoney(TOTAL_STAKED * STON_PRICE)}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)' }}>{(TOTAL_STAKED / 1e6).toFixed(1)}M STON tokens locked by 28,400+ users</div>
          <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
            {[
              { label: 'Base APR', value: `${BASE_APR}%`, color: 'white' },
              { label: 'Max APR (2yr)', value: `${(BASE_APR * 4.5).toFixed(1)}%`, color: '#FFD700' },
              { label: 'Total Stakers', value: '28,400+', color: 'white' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.65)' }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* Stake Form */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #f0f2f5' }}>
            {(['stake', 'unstake'] as const).map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ flex: 1, padding: '14px 0', background: 'none', border: 'none', borderBottom: `2.5px solid ${activeTab === t ? '#0098EA' : 'transparent'}`, color: activeTab === t ? '#0098EA' : '#888', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}
              >{t}</button>
            ))}
          </div>

          <div style={{ padding: 20 }}>
            {/* Amount */}
            <div style={{ background: '#f7f9fc', borderRadius: 14, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#888' }}>Amount to {activeTab}</span>
                <button onClick={() => setStakeAmt('1000')} style={{ fontSize: 12, color: '#0098EA', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                  Max: {connected ? '1,000' : '—'} STON
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                  <TokenIcon token="STON" size={28} />
                  STON
                </div>
                <input
                  type="number" value={stakeAmt}
                  onChange={(e) => setStakeAmt(e.target.value)}
                  placeholder="0.00"
                  style={{ flex: 1, textAlign: 'right', border: 'none', background: 'none', fontSize: 22, fontWeight: 700, color: stakeAmt ? '#111' : '#ccc', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ textAlign: 'right', fontSize: 11, color: '#aaa', marginTop: 4 }}>≈ ${usdValue}</div>
            </div>

            {/* Duration picker (stake mode only) */}
            {activeTab === 'stake' && (
              <>
                <div style={{ fontSize: 13, color: '#888', fontWeight: 600, marginBottom: 10 }}>Lock duration</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 16 }}>
                  {STAKING_OPTIONS.map((o) => (
                    <button key={o.months} onClick={() => setSelectedDuration(o.months)}
                      style={{ padding: '10px 4px', borderRadius: 12, border: `2px solid ${selectedDuration === o.months ? '#0098EA' : '#eee'}`, background: selectedDuration === o.months ? '#EFF6FF' : '#f7f9fc', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', transition: 'all .15s' }}
                    >
                      <div style={{ fontWeight: 800, fontSize: 14, color: selectedDuration === o.months ? '#0098EA' : '#111' }}>{o.label}</div>
                      <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{(BASE_APR * o.multiplier).toFixed(1)}%</div>
                    </button>
                  ))}
                </div>

                {/* Reward preview */}
                {stakeAmt && (
                  <div style={{ background: 'linear-gradient(135deg,#f0f9ff,#fdf4ff)', borderRadius: 14, padding: 14, marginBottom: 16, border: '1.5px solid #e0f0ff' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 10 }}>Estimated Rewards after {opt.label}</div>
                    {[
                      { label: 'STON rewards', value: `+${estimatedReward} STON`, color: '#0098EA' },
                      { label: 'GEMSTON tokens', value: `+${gemstoneReward} GEM`, color: '#7C3AED' },
                      { label: 'ARKENSTON NFT', value: '1 soul-bound NFT', color: '#F59E0B' },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: '#888' }}>{label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #e0f0ff', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#888' }}>Effective APR</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#22C55E' }}>{effectiveAPR.toFixed(1)}%</span>
                    </div>
                  </div>
                )}

                {/* Lock warning */}
                <div style={{ padding: '10px 12px', background: '#FFF7ED', borderRadius: 10, marginBottom: 16, border: '1.5px solid #FED7AA', display: 'flex', gap: 8 }}>
                  <span style={{ color: '#F59E0B', marginTop: 1, flexShrink: 0 }}>{Icons.lock}</span>
                  <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
                    Tokens locked for <strong>{selectedDuration} month{selectedDuration > 1 ? 's' : ''}</strong>.
                    ARKENSTON is soul-bound. GEMSTON is freely tradeable.
                    {opt.bonus > 0 && <span style={{ color: '#D97706' }}> +{opt.bonus}% bonus APR for this duration!</span>}
                  </div>
                </div>
              </>
            )}

            <button
              onClick={handleStake}
              disabled={!stakeAmt || !connected || staking}
              className="btn-primary"
              style={{ width: '100%', padding: 14, fontSize: 15, fontWeight: 700, borderRadius: 14 }}
            >
              {staking ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Spinner size={16} color="white" /> Processing...
                </span>
              ) : !connected ? 'Connect wallet' : !stakeAmt ? 'Enter amount' : activeTab === 'stake' ? `Stake for ${opt.label}` : 'Unstake STON'}
            </button>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Positions */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f2f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111' }}>My Positions</h3>
              <span style={{ fontSize: 12, color: '#888' }}>{stakePositions.length} active</span>
            </div>
            {stakePositions.length === 0 ? (
              <div style={{ padding: 36, textAlign: 'center', color: '#aaa' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                <div style={{ fontWeight: 600 }}>No staking positions</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Stake STON to start earning</div>
              </div>
            ) : (
              stakePositions.map((pos) => (
                <PositionCard key={pos.id} pos={pos} onClaim={handleClaim} />
              ))
            )}
          </div>

          {/* STON token info */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#111' }}>STON Token Stats</h3>
            {[
              { label: 'Price', value: '$0.21', badge: '-1.2%', badgeColor: '#EF4444' },
              { label: 'Market Cap', value: '$52.4M' },
              { label: 'Circulating Supply', value: '249.5M STON' },
              { label: 'Max Supply', value: '1B STON' },
              { label: 'Total Staked', value: `${(TOTAL_STAKED / 1e6).toFixed(1)}M STON` },
            ].map(({ label, value, badge, badgeColor }, i) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < 4 ? '1px solid #f5f5f5' : 'none' }}>
                <span style={{ fontSize: 13, color: '#888' }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{value}</span>
                  {badge && <span style={{ fontSize: 11, fontWeight: 700, color: badgeColor }}>{badge}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}