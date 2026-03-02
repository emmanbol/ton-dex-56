"use client";

import { fromUnits } from "@ston-fi/sdk";
import type { ChangeEvent } from "react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { type AssetInfo, useAssetsQuery } from "@/hooks/use-assets-query";
import { useStonApi } from "@/hooks/use-ston-api";
import { validateFloatValue } from "@/lib/utils";
import { Formatter } from "@/lib/formatter";
import { Icons } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/dex-ui";
import { TonAddressRegex } from "@/constants";

import { useSwapSimulation } from "../hooks/swap-simulation-query";
import { useSwapForm, useSwapFormDispatch } from "../providers/swap-form";
import { useSwapSettings, SLIPPAGE_TOLERANCE_OPTIONS } from "../providers/swap-settings";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function assetUsdValue(asset: AssetInfo) {
  const balance = asset.balance;
  const decimals = asset.meta?.decimals ?? 9;
  const priceUsd = asset.dexPriceUsd;
  if (!balance || !priceUsd) return 0;
  return Number(fromUnits(BigInt(balance), decimals)) * Number(priceUsd);
}

function sortAssets(a: AssetInfo, b: AssetInfo): number {
  const aV = assetUsdValue(a), bV = assetUsdValue(b);
  if (aV && bV) return bV - aV;
  if (aV && !bV) return -1;
  if (!aV && bV) return 1;
  return 0;
}

function getBalance(asset: AssetInfo | null): string {
  if (!asset?.balance) return "0";
  return fromUnits(BigInt(asset.balance), asset.meta?.decimals ?? 9);
}

function getUsdValue(asset: AssetInfo | null, amount: string): string {
  if (!asset || !amount || !asset.dexPriceUsd) return "";
  const usd = parseFloat(amount) * Number(asset.dexPriceUsd);
  if (isNaN(usd) || usd === 0) return "";
  return `≈$${usd.toFixed(2)}`;
}

// ─── Token picker button ───────────────────────────────────────────────────

function TokenButton({ asset, placeholder, onClick, loading }: {
  asset: AssetInfo | null;
  placeholder: string;
  onClick: () => void;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1.5px solid #eee', borderRadius: 14, padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit', minWidth: 120 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f0f2f5' }} />
        <div style={{ width: 40, height: 14, borderRadius: 6, background: '#f0f2f5' }} />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1.5px solid #eee', borderRadius: 14, padding: '8px 12px 8px 8px', cursor: 'pointer', fontWeight: 700, fontSize: 15, color: '#111', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, transition: 'border-color .15s' }}
      onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#0098EA'; }}
      onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#eee'; }}
    >
      {asset ? (
        <>
          {asset.meta?.imageUrl
            ? <img src={asset.meta.imageUrl} alt={asset.meta.symbol} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#0098EA,#7B61FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700 }}>{asset.meta?.symbol?.slice(0,2)}</div>
          }
          {asset.meta?.symbol}
        </>
      ) : (
        <span style={{ color: '#888', fontWeight: 500, fontSize: 14 }}>{placeholder}</span>
      )}
      <span style={{ color: '#aaa', marginLeft: 2 }}>{Icons.chevronDown}</span>
    </button>
  );
}

// ─── Token search modal ────────────────────────────────────────────────────

function TokenModal({ assets, onSelect, onClose, excludeAddress }: {
  assets: AssetInfo[];
  onSelect: (asset: AssetInfo) => void;
  onClose: () => void;
  excludeAddress?: string;
}) {
  const [query, setQuery] = useState('');
  const stonApi = useStonApi();
  const isAddress = TonAddressRegex.test(query.trim());

  const { data: addressResult, isFetching: addressFetching } = useQuery({
    queryKey: ["asset-by-address-modal", query.trim()],
    enabled: isAddress,
    queryFn: async () => {
      const results = await stonApi.queryAssets({ unconditionalAssets: [query.trim()] });
      return results.find(a => a.contractAddress.toLowerCase() === query.trim().toLowerCase()) ?? null;
    },
  });

  const POPULAR = ['TON', 'USDT', 'USDC', 'STON', 'NOT'];
  const popular = assets.filter(t => POPULAR.includes(t.meta?.symbol ?? '') && t.contractAddress !== excludeAddress);

  const filtered = isAddress ? [] : assets
    .filter(a =>
      a.contractAddress !== excludeAddress &&
      (a.meta?.symbol?.toLowerCase().includes(query.toLowerCase()) ||
       a.meta?.displayName?.toLowerCase().includes(query.toLowerCase()) ||
       a.contractAddress.toLowerCase().includes(query.toLowerCase()))
    )
    .slice(0, 80);

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
    >
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 440, padding: 20, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 17 }}>Select a token</span>
          <button onClick={onClose} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#555' }}>
            {Icons.close}
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }}>{Icons.search}</span>
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search name, symbol, or paste address"
            style={{ width: '100%', padding: '11px 12px 11px 38px', border: '1.5px solid #eee', borderRadius: 14, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border .15s' }}
            onFocus={e => { e.target.style.borderColor = '#0098EA'; }}
            onBlur={e => { e.target.style.borderColor = '#eee'; }}
          />
        </div>

        {/* Popular */}
        {!query && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#aaa', fontWeight: 600, marginBottom: 8 }}>Popular</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {popular.map(t => (
                <button key={t.contractAddress} onClick={() => { onSelect(t); onClose(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#f7f9fc', border: '1.5px solid #eee', borderRadius: 20, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#111', fontFamily: 'inherit' }}
                  onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#0098EA'; (e.currentTarget as HTMLButtonElement).style.background = '#EFF6FF'; }}
                  onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#eee'; (e.currentTarget as HTMLButtonElement).style.background = '#f7f9fc'; }}
                >
                  {t.meta?.imageUrl && <img src={t.meta.imageUrl} alt={t.meta.symbol} style={{ width: 18, height: 18, borderRadius: '50%' }} />}
                  {t.meta?.symbol}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Address lookup result */}
        {isAddress && (
          <div style={{ marginBottom: 8 }}>
            {addressFetching && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 8px', color: '#888', fontSize: 13 }}>
                <Spinner size={16} /> Looking up address...
              </div>
            )}
            {!addressFetching && !addressResult && (
              <div style={{ padding: '12px 8px', color: '#aaa', fontSize: 13, textAlign: 'center' }}>No token found for this address</div>
            )}
            {addressResult && (
              <button
                onClick={() => { onSelect(addressResult); onClose(); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', background: '#f7f9fc', border: 'none', borderRadius: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
              >
                {addressResult.meta?.imageUrl
                  ? <img src={addressResult.meta.imageUrl} alt={addressResult.meta.symbol} style={{ width: 40, height: 40, borderRadius: '50%' }} />
                  : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#0098EA,#7B61FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700 }}>{addressResult.meta?.symbol?.slice(0,2)}</div>
                }
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{addressResult.meta?.symbol}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{addressResult.meta?.displayName}</div>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Token list */}
        {!isAddress && (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 && query ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                <div style={{ fontSize: 14 }}>No token found for "{query}"</div>
              </div>
            ) : (
              filtered.map(asset => {
                const bal = getBalance(asset);
                const usdVal = asset.dexPriceUsd ? `$${Number(asset.dexPriceUsd).toFixed(4)}` : '';
                return (
                  <button key={asset.contractAddress} onClick={() => { onSelect(asset); onClose(); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', background: 'none', border: 'none', borderRadius: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                    onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f5f8fc'; }}
                    onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                  >
                    {asset.meta?.imageUrl
                      ? <img src={asset.meta.imageUrl} alt={asset.meta?.symbol} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#0098EA,#7B61FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{asset.meta?.symbol?.slice(0,2)}</div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{asset.meta?.symbol}</div>
                      <div style={{ fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.meta?.displayName}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {usdVal && <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{usdVal}</div>}
                      {bal && parseFloat(bal) > 0 && <div style={{ fontSize: 11, color: '#888' }}>{parseFloat(bal).toFixed(4)}</div>}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main SwapForm ─────────────────────────────────────────────────────────

export const SwapForm = () => {
  const { offerAsset, askAsset, offerAmount, askAmount } = useSwapForm();
  const dispatch = useSwapFormDispatch();
  const { slippageTolerance, setSlippageTolerance, autoSlippageTolerance, setAutoSlippageTolerance, omniston, setOmniston } = useSwapSettings();
  const { data: sim, isFetching: simLoading, error: simError } = useSwapSimulation();

  const [showSettings, setShowSettings] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showAskModal, setShowAskModal] = useState(false);

  const { data: assets, isLoading: assetsLoading } = useAssetsQuery({
    select: data => data.sort(sortAssets),
  });

  const allAssets = assets ?? [];
  const askAssets = allAssets.filter(a => a.contractAddress !== offerAsset?.contractAddress);

  // Auto-select TON and USDT as defaults once assets load
  useEffect(() => {
    if (allAssets.length === 0 || offerAsset || askAsset) return;
    const ton = allAssets.find(a => a.meta?.symbol === 'TON');
    const usdt = allAssets.find(a => a.meta?.symbol === 'USDT');
    if (ton) dispatch({ type: "SET_OFFER_ASSET", payload: ton });
    if (usdt) dispatch({ type: "SET_ASK_ASSET", payload: usdt });
  }, [allAssets.length]);

  const swapAssets = () => {
    const prevOffer = offerAsset;
    const prevAsk = askAsset;
    dispatch({ type: "SET_OFFER_ASSET", payload: prevAsk });
    dispatch({ type: "SET_ASK_ASSET", payload: prevOffer });
    if (displayAskAmount) dispatch({ type: "SET_OFFER_AMOUNT", payload: displayAskAmount });
  };

  const handleOfferPct = (pct: number) => {
    const bal = getBalance(offerAsset);
    if (!bal || bal === "0") return;
    dispatch({ type: "SET_OFFER_AMOUNT", payload: (parseFloat(bal) * pct).toFixed(6) });
  };

  const simAskAmount = sim && askAsset
    ? fromUnits(BigInt(sim.askUnits), askAsset.meta?.decimals ?? 9)
    : "";
  const displayAskAmount = simAskAmount || askAmount;

  const offerUsd = getUsdValue(offerAsset, offerAmount);
  const askUsd = getUsdValue(askAsset, displayAskAmount);
  const offerBal = getBalance(offerAsset);
  const askBal = getBalance(askAsset);
  const slipPct = (slippageTolerance * 100).toFixed(1);

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', width: '100%' }}>

      {/* Token modals */}
      {showOfferModal && (
        <TokenModal
          assets={allAssets}
          onSelect={a => { dispatch({ type: "SET_OFFER_ASSET", payload: a }); }}
          onClose={() => setShowOfferModal(false)}
          excludeAddress={askAsset?.contractAddress}
        />
      )}
      {showAskModal && (
        <TokenModal
          assets={askAssets}
          onSelect={a => { dispatch({ type: "SET_ASK_ASSET", payload: a }); }}
          onClose={() => setShowAskModal(false)}
          excludeAddress={offerAsset?.contractAddress}
        />
      )}

      <div className="card" style={{ overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '18px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f2f5' }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111' }}>Swap tokens</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowSettings(s => !s)}
              style={{ background: showSettings ? '#EFF6FF' : 'none', border: 'none', cursor: 'pointer', color: showSettings ? '#0098EA' : '#666', padding: 6, borderRadius: 8, display: 'flex' }}
            >{Icons.settings}</button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #f0f2f5' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 10 }}>Slippage tolerance</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {SLIPPAGE_TOLERANCE_OPTIONS.map(v => (
                <button key={v} onClick={() => setSlippageTolerance(v)}
                  style={{ padding: '6px 14px', borderRadius: 10, border: `1.5px solid ${slippageTolerance === v ? '#0098EA' : '#eee'}`, background: slippageTolerance === v ? '#EFF6FF' : 'white', color: slippageTolerance === v ? '#0098EA' : '#666', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}
                >{(v * 100).toFixed(1)}%</button>
              ))}
              <input type="number" placeholder="Custom %"
                value={SLIPPAGE_TOLERANCE_OPTIONS.includes(slippageTolerance as any) ? '' : slipPct}
                onChange={e => setSlippageTolerance(parseFloat(e.target.value) / 100 || 0.005)}
                style={{ width: 90, padding: '6px 10px', borderRadius: 10, border: '1.5px solid #eee', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>Auto slippage</span>
              <button onClick={() => setAutoSlippageTolerance(!autoSlippageTolerance)}
                style={{ width: 40, height: 22, borderRadius: 11, background: autoSlippageTolerance ? '#0098EA' : '#DDD', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s' }}
              >
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: autoSlippageTolerance ? 21 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
              </button>
              <span style={{ fontSize: 11, color: '#aaa' }}>Adaptive slippage for safer swaps</span>
            </div>
          </div>
        )}

        <div style={{ padding: 20 }}>

          {/* ── You send box ── */}
          <div style={{ background: '#f7f9fc', borderRadius: 16, padding: '14px 16px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>You send</span>
              {offerAsset && (
                <button onClick={() => handleOfferPct(1)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0098EA', fontSize: 13, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <span>{Icons.wallet}</span>
                  {parseFloat(offerBal).toFixed(4)}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <TokenButton
                asset={offerAsset}
                placeholder="Select token"
                onClick={() => setShowOfferModal(true)}
                loading={assetsLoading}
              />
              <div style={{ flex: 1, textAlign: 'right' }}>
                <input
                  type="number"
                  value={offerAmount}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    if (e.target.value && !validateFloatValue(e.target.value)) return;
                    dispatch({ type: "SET_OFFER_AMOUNT", payload: e.target.value });
                  }}
                  placeholder="0.00"
                  disabled={!offerAsset}
                  style={{ width: '100%', border: 'none', background: 'none', textAlign: 'right', fontSize: 26, fontWeight: 700, color: offerAmount ? '#111' : '#ccc', outline: 'none', fontFamily: 'inherit' }}
                />
                {offerUsd && <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{offerUsd}</div>}
              </div>
            </div>
            {offerAmount && parseFloat(offerBal) > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                {[25, 50, 75, 100].map(pct => (
                  <button key={pct} onClick={() => handleOfferPct(pct / 100)}
                    style={{ fontSize: 11, padding: '3px 9px', borderRadius: 8, border: '1.5px solid #0098EA20', background: '#EFF6FF', color: '#0098EA', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
                  >{pct === 100 ? 'MAX' : `${pct}%`}</button>
                ))}
              </div>
            )}
          </div>

          {/* ── Flip arrow ── */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '-6px 0', zIndex: 10, position: 'relative' }}>
            <button onClick={swapAssets}
              style={{ width: 40, height: 40, borderRadius: '50%', background: 'white', border: '2px solid #eef2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,.08)', color: '#0098EA', transition: 'transform .3s' }}
              onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'rotate(180deg)'; }}
              onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'rotate(0deg)'; }}
            >{Icons.swapVert}</button>
          </div>

          {/* ── You receive box ── */}
          <div style={{ background: '#f7f9fc', borderRadius: 16, padding: '14px 16px 12px', marginTop: -6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>You receive</span>
              {askAsset && <span style={{ fontSize: 13, color: '#aaa' }}>{parseFloat(askBal).toFixed(4)} bal</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flexShrink: 0 }}>
                <TokenButton
                  asset={askAsset}
                  placeholder="Select token"
                  onClick={() => setShowAskModal(true)}
                  loading={assetsLoading}
                />
                {askAsset && (
                  <div style={{ marginTop: 6 }}>
                    <a href={`https://tonviewer.com/${askAsset.contractAddress}`} target="_blank" rel="noreferrer"
                      style={{ fontSize: 12, color: '#0098EA', display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}
                    >Token info {Icons.external}</a>
                  </div>
                )}
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
                  {simLoading && offerAmount && <Spinner size={16} />}
                  <div style={{ fontSize: 26, fontWeight: 700, color: displayAskAmount ? '#111' : '#ccc' }}>
                    {displayAskAmount || '0.00'}
                  </div>
                </div>
                {askUsd && <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{askUsd}</div>}
              </div>
            </div>
          </div>

          {/* ── Omniston ── */}
          <div style={{ marginTop: 12, padding: '12px 14px', background: '#f7f9fc', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#0098EA,#7B61FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
            <button onClick={() => setOmniston(!omniston)}
              style={{ width: 44, height: 26, borderRadius: 13, background: omniston ? '#0098EA' : '#DDD', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}
            >
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: omniston ? 21 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
            </button>
          </div>

          {/* ── Sim error ── */}
          {simError && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#FFF1F2', border: '1.5px solid #FECDD3', borderRadius: 12, fontSize: 13, color: '#BE123C' }}>
              ⚠ {simError.message}
            </div>
          )}

          {/* ── Sim details ── */}
          {sim && !simError && offerAmount && displayAskAmount && offerAsset && askAsset && (
            <div style={{ marginTop: 12, padding: '12px 14px', background: '#f7f9fc', borderRadius: 12 }}>
              {[
                { label: 'Rate', value: `1 ${offerAsset.meta?.symbol} ≈ ${sim.swapRate} ${askAsset.meta?.symbol}`, color: '#111' },
                { label: 'Price impact', value: `${(Number(sim.priceImpact) * 100).toFixed(2)}%`, color: Number(sim.priceImpact) > 0.01 ? '#F59E0B' : '#22C55E' },
                { label: `Min received (${slipPct}% slippage)`, value: `${fromUnits(BigInt(sim.minAskUnits), askAsset.meta?.decimals ?? 9)} ${askAsset.meta?.symbol}`, color: '#111' },
                { label: 'Est. gas', value: `~${fromUnits(BigInt(sim.gasParams.estimatedGasConsumption), 9)} TON`, color: '#111' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 5 }}>
                  <span>{label}</span>
                  <span style={{ color, fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};