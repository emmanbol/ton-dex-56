'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { TokenIcon, fmtNumber } from '@/components/ui/index';
import { Icons } from '@/components/ui/Icons';
import type { Token } from '@/types';

interface TokenModalProps {
  tokens: Token[];
  onSelect: (token: Token) => void;
  onClose: () => void;
  exclude?: string; // symbol to exclude
  walletTokens?: Token[];
}

export function TokenModal({ tokens, onSelect, onClose, exclude, walletTokens = [] }: TokenModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle ESC key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  /*const filtered = tokens.filter((t) =>
    t.symbol !== exclude &&
    (t.symbol.toLowerCase().includes(query.toLowerCase()) ||
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.address.toLowerCase().includes(query.toLowerCase()))
  );*/

  const MAX_DISPLAY = 100;

  const filtered = useMemo(() => {
    return tokens
      .filter(t => t.symbol !== exclude && 
          (t.symbol.toLowerCase().includes(query.toLowerCase()) ||
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.address.toLowerCase().includes(query.toLowerCase()))
      )
      .slice(0, MAX_DISPLAY);
  }, [tokens, query, exclude]);

  // Popular tokens to show at top
  const POPULAR = ['TON', 'USDT', 'USDC', 'STON', 'NOT'];
  const popular = tokens.filter((t) => POPULAR.includes(t.symbol) && t.symbol !== exclude);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
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
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }}>
            {Icons.search}
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, symbol, or paste address"
            style={{ width: '100%', padding: '11px 12px 11px 38px', border: '1.5px solid #eee', borderRadius: 14, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border .15s' }}
            onFocus={(e) => { e.target.style.borderColor = '#0098EA'; }}
            onBlur={(e) => { e.target.style.borderColor = '#eee'; }}
          />
        </div>

        {/* Popular tokens (shown when not searching) */}
        {!query && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#aaa', fontWeight: 600, marginBottom: 8 }}>Popular</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {popular.map((t) => (
                <button
                  key={t.symbol}
                  onClick={() => onSelect(t)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#f7f9fc', border: '1.5px solid #eee', borderRadius: 20, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#111', fontFamily: 'inherit' }}
                  onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#0098EA'; (e.currentTarget as HTMLButtonElement).style.background = '#EFF6FF'; }}
                  onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#eee'; (e.currentTarget as HTMLButtonElement).style.background = '#f7f9fc'; }}
                >
                  <TokenIcon token={t} size={18} />
                  {t.symbol}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Token list */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 14 }}>No token found for "{query}"</div>
            </div>
          ) : (
            filtered.map((token) => {
              const walletToken = walletTokens.find((w) => w.symbol === token.symbol);
              const balance = walletToken?.balance || token.balance;
              return (
                <button
                  key={token.address}
                  onClick={() => onSelect(token)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', background: 'none', border: 'none', borderRadius: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                  onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f5f8fc'; }}
                  onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                >
                  <TokenIcon token={token} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{token.symbol}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{token.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {token.price !== undefined && (
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
                        ${fmtNumber(token.price)}
                      </div>
                    )}
                    {balance && parseFloat(balance) > 0 && (
                      <div style={{ fontSize: 11, color: '#888' }}>
                        {parseFloat(balance).toFixed(4)} bal
                      </div>
                    )}
                    {token.priceChange24h !== undefined && (
                      <div style={{ fontSize: 11, color: token.priceChange24h >= 0 ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
                        {token.priceChange24h >= 0 ? '+' : ''}{fmtNumber(token.priceChange24h)}%
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
