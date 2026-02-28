import { StonApiClient } from '@ston-fi/api';
import type { Token, Pool, SwapSimulation } from '@/types';

// ─── Singleton API client ─────────────────────────────────────────────────────
export const stonApiClient = new StonApiClient();

// ─── Contract addresses (TON mainnet) ────────────────────────────────────────
// STON.fi v2.2 Router (CPI model)
export const ROUTER_V2    = 'EQB3ncyBUTjZUA5EnFKR5_EnOMI9V1tTDGyiOR1-MEMAtERL';
// pTON v2.1 proxy — used as the "offer" address when swapping native TON
export const PTON_V2      = 'EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_9Qsow9UvmFEb11';
// STON staking contract
export const STAKING_ADDR = 'EQDmkj65Ab_m0aZaW8IpKw4kYqIgITw_HRstYEkVQ6NIYCyT';

// ─── Known token colour/meta map ─────────────────────────────────────────────
export const KNOWN_TOKENS: Record<string, Partial<Token>> = {
  TON:  { symbol: 'TON',  name: 'Toncoin',   address: PTON_V2,                                                  decimals: 9, color: '#0098EA' },
  STON: { symbol: 'STON', name: 'STON',       address: 'EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmn32llxF',    decimals: 9, color: '#2E86AB' },
  USDT: { symbol: 'USDT', name: 'Tether USD', address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',    decimals: 6, color: '#26A17B' },
  USDC: { symbol: 'USDC', name: 'USD Coin',   address: 'EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728',    decimals: 6, color: '#2775CA' },
  NOT:  { symbol: 'NOT',  name: 'Notcoin',    address: 'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT',    decimals: 9, color: '#F5A623' },
  GRAM: { symbol: 'GRAM', name: 'GRAM',       address: 'EQBhqTkqheCqLLsNixZzxRFqvEZCqK0d_vIZfXlGRWYfPvVi',    decimals: 9, color: '#8B5CF6' },
  BOLT: { symbol: 'BOLT', name: 'BOLT',       address: 'EQD0vdSA_NedR9uvbgN9EikRX-suesDxGeFg69XQMavfLqIw',    decimals: 9, color: '#EF4444' },
};

// ─── nano → human-readable ───────────────────────────────────────────────────
// The STON.fi API always returns balance/amount fields in NANO units.
// e.g.  13000000  nanoTON  (decimals=9) → 0.013 TON
// e.g.  2400000   nanoUSDT (decimals=6) → 2.4  USDT
export function fromNano(amount: string | number, decimals = 9): string {
  if (!amount || amount === '0') return '0';
  try {
    // Truncate any decimal part before converting to BigInt
    const str = String(typeof amount === 'number' ? Math.round(amount) : amount).split('.')[0];
    if (!str || str === '0') return '0';
    const n       = BigInt(str);
    const divisor = BigInt(10 ** decimals);
    const whole   = n / divisor;
    const frac    = n % divisor;
    if (frac === 0n) return whole.toString();
    const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
    return `${whole}.${fracStr}`;
  } catch {
    return '0';
  }
}

// ─── human-readable → nano ───────────────────────────────────────────────────
export function toNano(amount: string | number, decimals = 9): string {
  try {
    const str = typeof amount === 'number' ? amount.toFixed(decimals) : String(amount);
    const [whole, frac = ''] = str.split('.');
    const padded = frac.padEnd(decimals, '0').slice(0, decimals);
    return (BigInt(whole || '0') * BigInt(10 ** decimals) + BigInt(padded)).toString();
  } catch {
    return '0';
  }
}

// ─── Fetch all DEX assets ────────────────────────────────────────────────────
export async function fetchAssets(): Promise<Token[]> {
  try {
    const assets = await stonApiClient.getAssets();
    return (assets as any[]).map((a) => ({
      symbol:        a.symbol || 'UNKNOWN',
      name:          a.displayName || a.symbol || 'Unknown Token',
      address:       a.contractAddress || a.address || '',
      decimals:      a.decimals ?? 9,
      price:         a.dexPriceUsd ? parseFloat(a.dexPriceUsd) : undefined,
      priceChange24h: undefined,
      logoUrl:       a.imageUrl || a.imageUri || undefined,
      color:         KNOWN_TOKENS[a.symbol]?.color || '#888888',
    })).filter((t: Token) => !!t.address);
  } catch (err) {
    console.error('fetchAssets failed:', err);
    return FALLBACK_TOKENS;
  }
}

// ─── Fetch wallet balances ────────────────────────────────────────────────────
// CRITICAL: asset.balance from the API is in NANO units → must call fromNano()
export async function fetchWalletAssets(walletAddress: string): Promise<Token[]> {
  try {
    const assets = await stonApiClient.getWalletAssets(walletAddress);
    return (assets as any[]).map((a) => {
      const decimals    = a.decimals ?? 9;
      // Convert nano → human-readable (e.g. "13000000" → "0.013")
      const balanceHuman = fromNano(a.balance ?? '0', decimals);
      return {
        symbol:   a.symbol || 'UNKNOWN',
        name:     a.displayName || a.symbol || 'Unknown',
        address:  a.contractAddress || a.address || '',
        decimals,
        price:    a.dexPriceUsd ? parseFloat(a.dexPriceUsd) : undefined,
        balance:  balanceHuman,
        logoUrl:  a.imageUrl || undefined,
        color:    KNOWN_TOKENS[a.symbol]?.color || '#888888',
      };
    }).filter((t: Token) => !!t.address);
  } catch (err) {
    console.error('fetchWalletAssets failed:', err);
    return [];
  }
}

// ─── Fetch pools ─────────────────────────────────────────────────────────────
export async function fetchPools(): Promise<Pool[]> {
  try {
    const pools = await stonApiClient.getPools();
    return (pools as any[]).slice(0, 60).map((p) => ({
      address:       p.address,
      routerAddress: p.routerAddress || ROUTER_V2,
      token0: {
        symbol:   p.token0Metadata?.symbol || 'TOKEN0',
        name:     p.token0Metadata?.displayName || 'Token 0',
        address:  p.token0Address || '',
        decimals: p.token0Metadata?.decimals ?? 9,
        price:    p.token0Metadata?.dexPriceUsd ? parseFloat(p.token0Metadata.dexPriceUsd) : 0,
        logoUrl:  p.token0Metadata?.imageUrl || undefined,
        color:    KNOWN_TOKENS[p.token0Metadata?.symbol]?.color || '#888',
      },
      token1: {
        symbol:   p.token1Metadata?.symbol || 'TOKEN1',
        name:     p.token1Metadata?.displayName || 'Token 1',
        address:  p.token1Address || '',
        decimals: p.token1Metadata?.decimals ?? 9,
        price:    p.token1Metadata?.dexPriceUsd ? parseFloat(p.token1Metadata.dexPriceUsd) : 0,
        logoUrl:  p.token1Metadata?.imageUrl || undefined,
        color:    KNOWN_TOKENS[p.token1Metadata?.symbol]?.color || '#888',
      },
      tvl:      p.lpTotalSupplyUsd ? parseFloat(p.lpTotalSupplyUsd) : 0,
      volume24h: p.stats?.volume24h ? parseFloat(p.stats.volume24h) : 0,
      apr:      p.stats?.feeApr24h ? parseFloat(p.stats.feeApr24h) * 100 : 0,
      fee:      p.lpFee ? parseFloat(p.lpFee) * 100 : 0.3,
      isStable: p.lpFee !== undefined && parseFloat(p.lpFee) < 0.002,
    }));
  } catch (err) {
    console.error('fetchPools failed:', err);
    return FALLBACK_POOLS;
  }
}

// ─── Simulate swap (offerAmount = nano string) ───────────────────────────────
export async function simulateSwap(
  offerAddress: string,
  askAddress: string,
  offerAmount: string,
  slippage = '0.005',
): Promise<SwapSimulation | null> {
  try {
    const r = await stonApiClient.simulateSwap({
      offerAddress,
      askAddress,
      offerUnits: offerAmount,
      slippageTolerance: slippage,
    }) as any;
    return {
      offerAmount: r.offerUnits  || offerAmount,
      askAmount:   r.askUnits    || '0',
      priceImpact: r.priceImpact || '0',
      minAskAmount: r.minAskUnits || '0',
      feeAmount:   r.feeUnits    || '0',
      routerAddress: r.routerAddress || ROUTER_V2,
      poolAddress:   r.poolAddress   || '',
    };
  } catch (err) {
    console.error('simulateSwap failed:', err);
    return null;
  }
}

// ─── Fallback data ────────────────────────────────────────────────────────────
export const FALLBACK_TOKENS: Token[] = [
  { symbol: 'TON',  name: 'Toncoin',   address: PTON_V2,                                                  decimals: 9, price: 3.21,   priceChange24h:  2.4, color: '#0098EA', balance: '0' },
  { symbol: 'STON', name: 'STON',       address: 'EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmn32llxF',    decimals: 9, price: 0.21,   priceChange24h: -1.2, color: '#2E86AB', balance: '0' },
  { symbol: 'USDT', name: 'Tether USD', address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',    decimals: 6, price: 1.0,    priceChange24h:  0.01,color: '#26A17B', balance: '0' },
  { symbol: 'USDC', name: 'USD Coin',   address: 'EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728',    decimals: 6, price: 1.0,    priceChange24h:  0.0, color: '#2775CA', balance: '0' },
  { symbol: 'NOT',  name: 'Notcoin',    address: 'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT',    decimals: 9, price: 0.0081, priceChange24h:  5.3, color: '#F5A623', balance: '0' },
  { symbol: 'GRAM', name: 'GRAM',       address: 'EQBhqTkqheCqLLsNixZzxRFqvEZCqK0d_vIZfXlGRWYfPvVi',    decimals: 9, price: 0.043,  priceChange24h: -0.8, color: '#8B5CF6', balance: '0' },
  { symbol: 'BOLT', name: 'BOLT',       address: 'EQD0vdSA_NedR9uvbgN9EikRX-suesDxGeFg69XQMavfLqIw',    decimals: 9, price: 0.0012, priceChange24h: 12.1, color: '#EF4444', balance: '0' },
];

export const FALLBACK_POOLS: Pool[] = [
  {
    address: 'EQBsGx9ArADUrREB34W-ghgsCgBShvfUr4JFuSR7QBuck0lj',
    token0: FALLBACK_TOKENS[0], token1: FALLBACK_TOKENS[2],
    tvl: 48200000, volume24h: 8900000, apr: 24.3, fee: 0.3,
  },
  {
    address: 'EQD7S-H0PjlTIf5pLNSXSKh82Fz7HE3bRbD8nqlvmzXCxOG',
    token0: FALLBACK_TOKENS[0], token1: FALLBACK_TOKENS[1],
    tvl: 12400000, volume24h: 2100000, apr: 18.7, fee: 0.3,
  },
  {
    address: 'EQDd3NPNrWCvTA1pOJ9WetlyMeh-8NmCf-Or5oNWEGzbTpz0',
    token0: FALLBACK_TOKENS[2], token1: FALLBACK_TOKENS[3],
    tvl: 9800000, volume24h: 4200000, apr: 6.2, fee: 0.05, isStable: true,
  },
  {
    address: 'EQBdOHal6MbWuQMc6QbG8-YBbpWYQzPhtByOAGpAMsYdBNiX',
    token0: FALLBACK_TOKENS[0], token1: FALLBACK_TOKENS[4],
    tvl: 5600000, volume24h: 1800000, apr: 42.1, fee: 0.3, isFarming: true,
  },
];