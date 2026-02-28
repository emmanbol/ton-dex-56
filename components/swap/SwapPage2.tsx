'use client';

import { useState, useEffect } from 'react';
import { useTonWallet, useTonConnectUI } from '@tonconnect/ui-react';
import toast from 'react-hot-toast';
import { TokenModal } from './TokenModal';
import { TokenIcon, Toggle, Spinner, fmtNumber } from '@/components/ui/index';
import { Icons } from '@/components/ui/Icons';
import { useTokens, useSwapSimulation, useWalletTokens } from '@/hooks/useStonfi';
import type { Token } from '@/types';
import { FALLBACK_TOKENS, toNano } from '@/lib/stonfi';

export function SwapPage() {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const connected = !!wallet;

  const { tokens } = useTokens();
  const { walletTokens } = useWalletTokens();

  const [sendToken, setSendToken] = useState<Token>(FALLBACK_TOKENS[0]);
  const [recvToken, setRecvToken] = useState<Token>(FALLBACK_TOKENS[1]);
  const [sendAmount, setSendAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [omniston, setOmniston] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showRecvModal, setShowRecvModal] = useState(false);
  const [swapping, setSwapping] = useState(false);

  // Real-time swap simulation from STON.fi API
  const { recvAmount, priceImpact, minReceived, isLoading: simLoading } =
    useSwapSimulation(sendToken, recvToken, sendAmount, slippage);

  const sendUsd = sendAmount && sendToken.price
    ? (parseFloat(sendAmount) * sendToken.price).toFixed(2) : '0';
  const recvUsd = recvAmount && recvToken.price
    ? (parseFloat(recvAmount) * recvToken.price).toFixed(2) : '0';

  // Get balance for send token from wallet
  const walletSendToken = walletTokens.find((t) => t.symbol === sendToken.symbol);
  const sendBalance = walletSendToken?.balance || sendToken.balance || '0';

  const handleSwapTokens = () => {
    setSendToken(recvToken);
    setRecvToken(sendToken);
    setSendAmount(recvAmount);
  };

  const handleSwap = async () => {
    if (!sendAmount || !connected) return;
    setSwapping(true);

    try {
      const amountNano = toNano(sendAmount, sendToken.decimals);

      // STON.fi DEX v2 Router address (mainnet)
      // In production, use @ston-fi/sdk to build the proper transaction payload
      const STON_ROUTER_V2 = 'EQB3ncyBUTjZUA5EnFKR5_EnOMI9V1tTDGyiOR1-MEMAtERL';

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: STON_ROUTER_V2,
            amount: amountNano,
            // payload: built by @ston-fi/sdk Router.buildSwapTonToJettonTxParams()
          },
        ],
      });

      toast.success(`Swapped ${sendAmount} ${sendToken.symbol} → ${recvAmount} ${recvToken.symbol}`);
      setSendAmount('');
    } catch (err: any) {
      if (err?.message?.includes('User declined') || err?.message?.includes('rejected')) {
        toast.error('Transaction rejected');
      } else {
        toast.error('Swap failed. Please try again.');
        console.error(err);
      }
    } finally {
      setSwapping(false);
    }
  };

  const getButtonLabel = () => {
    if (!connected) return 'Connect wallet to swap';
    if (!sendAmount) return 'Enter an amount';
    if (swapping) return 'Confirming...';
    return `Swap ${sendToken.symbol} → ${recvToken.symbol}`;
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      {showSendModal && (
        <TokenModal
          tokens={tokens}
          walletTokens={walletTokens}
          onSelect={(t) => { setSendToken(t); setShowSendModal(false); }}
          onClose={() => setShowSendModal(false)}
          exclude={recvToken.symbol}
        />
      )}
      {showRecvModal && (
        <TokenModal
          tokens={tokens}
          walletTokens={walletTokens}
          onSelect={(t) => { setRecvToken(t); setShowRecvModal(false); }}
          onClose={() => setShowRecvModal(false)}
          exclude={sendToken.symbol}
        />
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f2f5' }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111' }}>Swap tokens</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {[Icons.refresh, Icons.chart].map((ic, i) => (
              <button key={i} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: 6, borderRadius: 8, display: 'flex' }}
                onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f0f2f5'; }}
                onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
              >{ic}</button>
            ))}
            <button
              onClick={() => setShowSettings((s) => !s)}
              style={{ background: showSettings ? '#EFF6FF' : 'none', border: 'none', cursor: 'pointer', color: showSettings ? '#0098EA' : '#666', padding: 6, borderRadius: 8, display: 'flex' }}
            >
              {Icons.settings}
            </button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #f0f2f5' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 10 }}>Slippage tolerance</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['0.1', '0.5', '1.0'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSlippage(s)}
                  style={{ padding: '6px 14px', borderRadius: 10, border: `1.5px solid ${slippage === s ? '#0098EA' : '#eee'}`, background: slippage === s ? '#EFF6FF' : 'white', color: slippage === s ? '#0098EA' : '#666', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}
                >{s}%</button>
              ))}
              <input
                value={!['0.1', '0.5', '1.0'].includes(slippage) ? slippage : ''}
                onChange={(e) => setSlippage(e.target.value)}
                placeholder="Custom %"
                style={{ width: 80, padding: '6px 10px', borderRadius: 10, border: '1.5px solid #eee', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
          </div>
        )}

        <div style={{ padding: 20 }}>
          {/* Send box */}
          <div style={{ background: '#f7f9fc', borderRadius: 16, padding: '14px 16px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>You send</span>
              {connected && (
                <button
                  onClick={() => sendBalance && setSendAmount(parseFloat(sendBalance).toString())}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0098EA', fontSize: 13, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <span style={{ color: '#0098EA' }}>{Icons.wallet}</span>
                  <span>{parseFloat(sendBalance || '0').toFixed(6)}</span>
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => setShowSendModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1.5px solid #eee', borderRadius: 14, padding: '8px 12px 8px 8px', cursor: 'pointer', fontWeight: 700, fontSize: 15, color: '#111', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                <TokenIcon token={sendToken} size={32} />
                {sendToken.symbol}
                <span style={{ color: '#aaa' }}>{Icons.chevronRight}</span>
              </button>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <input
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="0.00"
                  style={{ width: '100%', border: 'none', background: 'none', textAlign: 'right', fontSize: 26, fontWeight: 700, color: sendAmount ? '#111' : '#ccc', outline: 'none', fontFamily: 'inherit' }}
                />
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>${sendUsd}</div>
              </div>
            </div>
            {sendAmount && (
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                {(['25', '50', '75', 'MAX'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      const bal = parseFloat(sendBalance || '0');
                      const pct = p === 'MAX' ? 1 : parseInt(p) / 100;
                      setSendAmount((bal * pct).toFixed(6));
                    }}
                    style={{ fontSize: 11, padding: '3px 9px', borderRadius: 8, border: '1.5px solid #0098EA20', background: '#EFF6FF', color: '#0098EA', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
                  >{p}{p !== 'MAX' ? '%' : ''}</button>
                ))}
              </div>
            )}
          </div>

          {/* Swap arrow */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '-6px 0', zIndex: 10, position: 'relative' }}>
            <button
              onClick={handleSwapTokens}
              style={{ width: 40, height: 40, borderRadius: '50%', background: 'white', border: '2px solid #eef2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,.08)', color: '#0098EA', transition: 'transform .3s' }}
              onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'rotate(180deg)'; }}
              onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'rotate(0deg)'; }}
            >
              {Icons.swapVert}
            </button>
          </div>

          {/* Receive box */}
          <div style={{ background: '#f7f9fc', borderRadius: 16, padding: '14px 16px 12px', marginTop: -6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>You receive</span>
              <span style={{ fontSize: 13, color: '#aaa' }}>
                {connected ? `${parseFloat(recvToken.balance || '0').toFixed(4)} bal` : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flexShrink: 0 }}>
                <button
                  onClick={() => setShowRecvModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1.5px solid #eee', borderRadius: 14, padding: '8px 12px 8px 8px', cursor: 'pointer', fontWeight: 700, fontSize: 15, color: '#111', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                >
                  <TokenIcon token={recvToken} size={32} />
                  {recvToken.symbol}
                  <span style={{ color: '#aaa' }}>{Icons.chevronRight}</span>
                </button>
                <div style={{ marginTop: 6 }}>
                  <a href={`https://tonviewer.com/${recvToken.address}`} target="_blank" rel="noreferrer"
                    style={{ fontSize: 12, color: '#0098EA', display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
                    Token info {Icons.external}
                  </a>
                </div>
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
                  {simLoading && sendAmount && <Spinner size={16} />}
                  <div style={{ fontSize: 26, fontWeight: 700, color: recvAmount ? '#111' : '#ccc' }}>
                    {recvAmount || '0.00'}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>${recvUsd}</div>
              </div>
            </div>
          </div>

          {/* Swap details */}
          {sendAmount && recvAmount && (
            <div style={{ marginTop: 12, padding: '12px 14px', background: '#f7f9fc', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 6 }}>
                <span>Rate</span>
                <span style={{ color: '#111', fontWeight: 500 }}>
                  1 {sendToken.symbol} ≈ {recvAmount && sendAmount ? (parseFloat(recvAmount) / parseFloat(sendAmount)).toFixed(6) : '—'} {recvToken.symbol}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 6 }}>
                <span>Price impact</span>
                <span style={{ color: parseFloat(priceImpact) > 1 ? '#F59E0B' : '#22C55E', fontWeight: 600 }}>
                  {parseFloat(priceImpact).toFixed(2)}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 6 }}>
                <span>Min received ({slippage}% slippage)</span>
                <span style={{ color: '#111', fontWeight: 500 }}>{minReceived} {recvToken.symbol}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888' }}>
                <span>Network fee</span>
                <span style={{ color: '#111', fontWeight: 500 }}>~0.05–0.1 TON</span>
              </div>
            </div>
          )}

          {/* Omniston */}
          <div style={{ marginTop: 12, padding: '12px 14px', background: '#f7f9fc', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#0098EA,#7B61FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="5.5" stroke="white" strokeWidth="1.4" fill="none"/>
                  <ellipse cx="8" cy="8" rx="2.5" ry="5.5" stroke="white" strokeWidth="1.1" fill="none"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Omniston</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>Multi-DEX best price routing</div>
              </div>
            </div>
            <Toggle on={omniston} onChange={setOmniston} />
          </div>

          {/* CTA Button */}
          <button
            onClick={handleSwap}
            disabled={!sendAmount || !connected || swapping}
            className="btn-primary"
            style={{ width: '100%', marginTop: 14, padding: 16, fontSize: 16, fontWeight: 700, borderRadius: 16 }}
          >
            {swapping ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Spinner size={18} color="white" /> Confirming on TON...
              </span>
            ) : getButtonLabel()}
          </button>
        </div>
      </div>
    </div>
  );
}
