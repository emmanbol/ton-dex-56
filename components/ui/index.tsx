'use client';

import Image from 'next/image';
import type { Token } from '@/types';

// ─── Token Icon ───────────────────────────────────────────────────────────────
const TOKEN_COLORS: Record<string, string> = {
  TON: '#0098EA', STON: '#2E86AB', USDT: '#26A17B', USDC: '#2775CA',
  NOT: '#F5A623', GRAM: '#8B5CF6', BOLT: '#EF4444', jUSDT: '#26A17B',
};

export function TokenIcon({ token, size = 36 }: { token: Token | string; size?: number }) {
  const symbol = typeof token === 'string' ? token : token.symbol;
  const logoUrl = typeof token === 'object' ? token.logoUrl : undefined;
  const color = typeof token === 'object' ? token.color : TOKEN_COLORS[symbol] || '#888';

  if (logoUrl) {
    return (
      <div
        style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}
      >
        <img
          src={logoUrl}
          alt={symbol}
          width={size}
          height={size}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%', background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontWeight: 800, fontSize: size * 0.28, flexShrink: 0,
        boxShadow: `0 2px 8px ${color}55`,
      }}
    >
      {symbol.slice(0, 3)}
    </div>
  );
}

// ─── Double Token Icon (for pools) ────────────────────────────────────────────
export function DoubleTokenIcon({ t0, t1, size = 36 }: { t0: Token | string; t1: Token | string; size?: number }) {
  return (
    <div style={{ position: 'relative', width: size + size * 0.5, height: size, flexShrink: 0 }}>
      <TokenIcon token={t0} size={size} />
      <div style={{ position: 'absolute', top: 0, left: size * 0.6, border: '2px solid white', borderRadius: '50%' }}>
        <TokenIcon token={t1} size={size} />
      </div>
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 44, height: 26, borderRadius: 13,
        background: on ? '#0098EA' : '#DDD',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background .2s', flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 20, height: 20, borderRadius: '50%', background: 'white',
          position: 'absolute', top: 3, left: on ? 21 : 3,
          transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        }}
      />
    </button>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function Spinner({ size = 20, color = '#0098EA' }: { size?: number; color?: string }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        border: `2px solid ${color}30`,
        borderTopColor: color,
        animation: 'spin 0.7s linear infinite',
      }}
    />
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
export function Skeleton({ w = '100%', h = 16, rounded = 8 }: { w?: string | number; h?: number; rounded?: number }) {
  return (
    <div
      style={{
        width: w, height: h, borderRadius: rounded,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'hot' | 'new' | 'success' | 'warning' }) {
  const styles: Record<string, React.CSSProperties> = {
    default: { background: '#f0f2f5', color: '#555' },
    hot: { background: '#FFF7ED', color: '#F59E0B' },
    new: { background: '#EFF6FF', color: '#0098EA' },
    success: { background: '#F0FDF4', color: '#16A34A' },
    warning: { background: '#FEF9C3', color: '#CA8A04' },
  };

  return (
    <span
      style={{
        fontSize: 11, padding: '2px 8px', borderRadius: 20,
        fontWeight: 700, ...styles[variant],
      }}
    >
      {children}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 4, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Format helpers ───────────────────────────────────────────────────────────
export function fmtNumber(n: number, d = 2): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function fmtMoney(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export function truncateAddress(addr: string, chars = 4): string {
  if (!addr) return '';
  return `${addr.slice(0, chars + 2)}...${addr.slice(-chars)}`;
}
