"use client";

import { fromUnits, toUnits } from "@ston-fi/sdk";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { useRef, useState } from "react";
import { WalletGuard } from "@/components/wallet-guard";
import { Spinner } from "@/components/ui/dex-ui";
import { Icons } from "@/components/ui/Icons";

import { buildStakeMessage } from "../actions/build-stake-message";
import { useStakeForm } from "../providers/stake-form";
import { STAKE_FORM_DURATION_OPTIONS } from "../constants";

const DURATION_LABELS: Record<number, string> = { 3: '3mo', 6: '6mo', 12: '1yr', 24: '2yr' };
const BASE_APR = 14.8;
const MULTIPLIERS: Record<number, number> = { 3: 1.0, 6: 1.5, 12: 2.0, 24: 3.5 };

function stringToBn(value: string): bigint | undefined {
  if (!value) return undefined;
  return toUnits(value, 9);
}

export function StakeForm(props: Omit<React.ComponentProps<"div">, "children">) {
  const inputId = useRef("stake-amount");
  const [tonConnectUI] = useTonConnectUI();
  const walletAddress = useTonAddress();
  const { state, setAmount, setDurationMonths } = useStakeForm();
  const [isStaking, setIsStaking] = useState(false);
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake');
  const [inputVal, setInputVal] = useState(
    state.amount === undefined ? "" : fromUnits(state.amount, 9)
  );

  const durationOptions: number[] = [...STAKE_FORM_DURATION_OPTIONS];

  const multiplier = MULTIPLIERS[state.durationMonths] ?? 2.0;
  const effectiveAPR = BASE_APR * multiplier;
  const estimatedReward = inputVal
    ? (parseFloat(inputVal) * (effectiveAPR / 100) * (state.durationMonths / 12)).toFixed(4) : '0';
  const gemstoneReward = inputVal
    ? (parseFloat(inputVal) * multiplier).toFixed(2) : '0';
  const canSubmit = state.amount !== undefined && state.amount > 0n;

  const handleStake = async () => {
    if (!canSubmit) return;
    setIsStaking(true);
    try {
      const message = await buildStakeMessage(state.amount!, state.durationMonths, walletAddress);
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 5 * 60,
        messages: [message],
      });
    } finally {
      setIsStaking(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 16, alignItems: 'start' }} {...props}>
      {/* Stake Form Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #f0f2f5' }}>
          {(['stake', 'unstake'] as const).map(t => (
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
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 15, flexShrink: 0, color: '#111' }}>
                STON
              </div>
              <input
                id={inputId.current}
                type="number"
                value={inputVal}
                onChange={e => {
                  const v = e.target.value;
                  setInputVal(v);
                  if (v === "") setAmount(undefined);
                  else if (v !== ".") setAmount(stringToBn(v));
                }}
                placeholder="0.00"
                style={{ flex: 1, textAlign: 'right', border: 'none', background: 'none', fontSize: 22, fontWeight: 700, color: inputVal ? '#111' : '#ccc', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
          </div>

          {/* Duration picker */}
          {activeTab === 'stake' && (
            <>
              <div style={{ fontSize: 13, color: '#888', fontWeight: 600, marginBottom: 10 }}>Lock duration</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: 6, marginBottom: 16 }}>
                {durationOptions.map(months => (
                  <button key={months} onClick={() => setDurationMonths(months)}
                    style={{ padding: '10px 4px', borderRadius: 12, border: `2px solid ${state.durationMonths === months ? '#0098EA' : '#eee'}`, background: state.durationMonths === months ? '#EFF6FF' : '#f7f9fc', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', transition: 'all .15s' }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 14, color: state.durationMonths === months ? '#0098EA' : '#111' }}>
                      {DURATION_LABELS[months] ?? `${months}mo`}
                    </div>
                    <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                      {(BASE_APR * (MULTIPLIERS[months] ?? 1)).toFixed(1)}%
                    </div>
                  </button>
                ))}
              </div>

              {/* Reward preview */}
              {inputVal && parseFloat(inputVal) > 0 && (
                <div style={{ background: 'linear-gradient(135deg,#f0f9ff,#fdf4ff)', borderRadius: 14, padding: 14, marginBottom: 16, border: '1.5px solid #e0f0ff' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 10 }}>
                    Estimated rewards after {DURATION_LABELS[state.durationMonths] ?? `${state.durationMonths}mo`}
                  </div>
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
                  Tokens will be locked for <strong>{state.durationMonths} months</strong>. ARKENSTON is soul-bound; GEMSTON is freely tradeable.
                </div>
              </div>
            </>
          )}

          {/* Submit button */}
          <WalletGuard
            fallback={
              <button
                onClick={() => tonConnectUI.openModal()}
                className="btn-primary"
                style={{ width: '100%', padding: 14, fontSize: 15 }}
              >
                Connect wallet
              </button>
            }
          >
            <button
              onClick={handleStake}
              disabled={!canSubmit || isStaking}
              className="btn-primary"
              style={{ width: '100%', padding: 14, fontSize: 15 }}
            >
              {isStaking
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Spinner size={16} color="white" /> Processing...</span>
                : !canSubmit ? 'Enter an amount'
                : activeTab === 'stake' ? `Stake for ${DURATION_LABELS[state.durationMonths] ?? `${state.durationMonths}mo`}`
                : 'Unstake STON'}
            </button>
          </WalletGuard>
        </div>
      </div>

      {/* Right: Active NFTs */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#111' }}>My Staking NFTs</h3>
        <WalletGuard
          fallback={
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔗</div>
              <div style={{ fontWeight: 600 }}>Connect wallet to view</div>
            </div>
          }
        >
          <NftListInline />
        </WalletGuard>
      </div>
    </div>
  );
}

// Inline NFT list for the right column
import { useQuery } from "@tanstack/react-query";
import { walletStakeInfoQueryOptions } from "../hooks/use-wallet-stake-nft-query";
import { StakeNftStatus } from "../constants";
import { Formatter } from "@/lib/formatter";

function NftListInline() {
  const walletAddress = useTonAddress();
  const { data, isLoading } = useQuery({
    ...walletStakeInfoQueryOptions(walletAddress),
    select: raw => raw.nfts.filter(n => n.status === StakeNftStatus.Active),
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[1, 2].map(i => (
          <div key={i} style={{ height: 60, borderRadius: 12, background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0', color: '#aaa' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>No staking positions yet</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>Stake STON to get started</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map(nft => (
        <div key={nft.address} style={{ background: '#f7f9fc', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={nft.imageUrl} alt="NFT" style={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{Formatter.address(nft.address)}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
              {Formatter.units(nft.stakedTokens, 9)} STON • {Formatter.units(nft.mintedGemston, 9)} GEM
            </div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>
              Unlock: {nft.minUnstakingTimestamp.toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}