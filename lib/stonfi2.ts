import { StonApiClient } from '@ston-fi/api';
import type { Token, Pool, SwapSimulation } from '@/types';

// ─── Singleton API client ──────────────────────────────────────────────────────
export const stonApiClient = new StonApiClient();

// ─── Known token addresses on TON mainnet ────────────────────────────────────
export const KNOWN_TOKENS: Record<string, Partial<Token>> = {
  TON: {
    symbol: 'TON',
    name: 'Toncoin',
    address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c', // pTON proxy
    decimals: 9,
    color: '#0098EA',
  },
  STON: {
    symbol: 'STON',
    name: 'STON',
    address: 'EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmn32llxF',
    decimals: 9,
    color: '#2E86AB',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
    decimals: 6,
    color: '#26A17B',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: 'EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728',
    decimals: 6,
    color: '#2775CA',
  },
  NOT: {
    symbol: 'NOT',
    name: 'Notcoin',
    address: 'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT',
    decimals: 9,
    color: '#F5A623',
  },
};

// ─── Format token amount from nano units ──────────────────────────────────────
export function fromNano(amount: string | number, decimals: number = 9): string {
  const n = typeof amount === 'string' ? BigInt(amount) : BigInt(Math.round(Number(amount)));
  const divisor = BigInt(10 ** decimals);
  const whole = n / divisor;
  const fraction = n % divisor;
  if (fraction === 0n) return whole.toString();
  const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${whole}.${fractionStr}`;
}

// ─── Format token amount to nano units ────────────────────────────────────────
export function toNano(amount: string | number, decimals: number = 9): string {
  const str = typeof amount === 'number' ? amount.toString() : amount;
  const [whole, fraction = ''] = str.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return (BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFraction)).toString();
}

// ─── Fetch live assets from STON.fi API ───────────────────────────────────────
export async function fetchAssets(): Promise<Token[]> {
  try {
    const assets = await stonApiClient.getAssets();
    return assets.map((asset: any) => ({
      symbol: asset.symbol || asset.displayName || 'UNKNOWN',
      name: asset.displayName || asset.symbol || 'Unknown Token',
      address: asset.contractAddress || asset.address,
      decimals: asset.decimals || 9,
      price: asset.dexPriceUsd ? parseFloat(asset.dexPriceUsd) : undefined,
      priceChange24h: asset.thirdPartyPriceUsd ? undefined : undefined,
      logoUrl: asset.imageUrl || asset.imageUri,
      color: KNOWN_TOKENS[asset.symbol]?.color || '#888888',
    }));
  } catch (error) {
    console.error('Failed to fetch assets from STON.fi API:', error);
    // Return fallback tokens
    return Object.values(KNOWN_TOKENS) as Token[];
  }
}

// ─── Fetch wallet asset balances ───────────────────────────────────────────────
export async function fetchWalletAssets(walletAddress: string): Promise<Token[]> {
  try {
    const assets = await stonApiClient.getWalletAssets(walletAddress);
    return (assets as any[])
      .filter((a: any) => a.contractAddress || a.address)
      .map((asset: any) => {
        const decimals = asset.decimals ?? 9;
        // Convert nano balance → human readable
        const balanceHuman = fromNano(asset.balance ?? '0', decimals);
        return {
          symbol: asset.symbol || 'UNKNOWN',
          name: asset.displayName || asset.symbol || 'Unknown',
          address: asset.contractAddress || asset.address,
          decimals,
          price: asset.dexPriceUsd ? parseFloat(asset.dexPriceUsd) : undefined,
          balance: balanceHuman,   // ← "0.013" not "13000000"
          logoUrl: asset.imageUrl || undefined,
          color: KNOWN_TOKENS[asset.symbol]?.color || '#888888',
        };
      });
  } catch (error) {
    console.error('fetchWalletAssets failed:', error);
    return [];
  }
}

// ─── Fetch live pools ──────────────────────────────────────────────────────────
export async function fetchPools(): Promise<Pool[]> {
  try {
    const pools = await stonApiClient.getPools();
    return pools.slice(0, 50).map((pool: any) => ({
      address: pool.address,
      token0: {
        symbol: pool.token0Metadata?.symbol || 'TOKEN0',
        name: pool.token0Metadata?.displayName || 'Token 0',
        address: pool.token0Address,
        decimals: pool.token0Metadata?.decimals || 9,
        price: pool.token0Metadata?.dexPriceUsd ? parseFloat(pool.token0Metadata.dexPriceUsd) : 0,
        logoUrl: pool.token0Metadata?.imageUrl,
        color: KNOWN_TOKENS[pool.token0Metadata?.symbol]?.color || '#888',
      },
      token1: {
        symbol: pool.token1Metadata?.symbol || 'TOKEN1',
        name: pool.token1Metadata?.displayName || 'Token 1',
        address: pool.token1Address,
        decimals: pool.token1Metadata?.decimals || 9,
        price: pool.token1Metadata?.dexPriceUsd ? parseFloat(pool.token1Metadata.dexPriceUsd) : 0,
        logoUrl: pool.token1Metadata?.imageUrl,
        color: KNOWN_TOKENS[pool.token1Metadata?.symbol]?.color || '#888',
      },
      tvl: pool.lpTotalSupplyUsd ? parseFloat(pool.lpTotalSupplyUsd) : 0,
      volume24h: pool.stats?.volume24h ? parseFloat(pool.stats.volume24h) : 0,
      apr: pool.stats?.feeApr24h ? parseFloat(pool.stats.feeApr24h) * 100 : 0,
      fee: pool.lpFee ? parseFloat(pool.lpFee) * 100 : 0.3,
      isStable: pool.lpFee !== undefined && parseFloat(pool.lpFee) < 0.002,
    }));
  } catch (error) {
    console.error('Failed to fetch pools:', error);
    return FALLBACK_POOLS;
  }
}

// ─── Simulate a swap ──────────────────────────────────────────────────────────
export async function simulateSwap(
  offerAddress: string,
  askAddress: string,
  offerAmount: string,
  slippage: string = '0.005'
): Promise<SwapSimulation | null> {
  try {
    const result = await stonApiClient.simulateSwap({
      offerAddress,
      askAddress,
      offerUnits: offerAmount,
      slippageTolerance: slippage,
    });
    return {
      offerAmount: result.offerUnits,
      askAmount: result.askUnits,
      priceImpact: result.priceImpact || '0',
      minAskAmount: result.minAskUnits,
      feeAmount: result.feeUnits || '0',
      routerAddress: result.routerAddress || '',
      poolAddress: result.poolAddress || '',
    };
  } catch (error) {
    console.error('Swap simulation failed:', error);
    return null;
  }
}

// ─── Fallback pool data (shown while API loads or on error) ──────────────────
export const FALLBACK_POOLS: Pool[] = [
  {
    address: 'EQPool1',
    token0: { symbol: 'TON', name: 'Toncoin', address: 'native', decimals: 9, color: '#0098EA', price: 3.21 },
    token1: { symbol: 'USDT', name: 'Tether USD', address: 'EQCxE6mU', decimals: 6, color: '#26A17B', price: 1.0 },
    tvl: 48200000, volume24h: 8900000, apr: 24.3, fee: 0.3,
  },
  {
    address: 'EQPool2',
    token0: { symbol: 'TON', name: 'Toncoin', address: 'native', decimals: 9, color: '#0098EA', price: 3.21 },
    token1: { symbol: 'STON', name: 'STON', address: 'EQA2kCVN', decimals: 9, color: '#2E86AB', price: 0.21 },
    tvl: 12400000, volume24h: 2100000, apr: 18.7, fee: 0.3,
  },
  {
    address: 'EQPool3',
    token0: { symbol: 'USDT', name: 'Tether USD', address: 'EQCxE6mU', decimals: 6, color: '#26A17B', price: 1.0 },
    token1: { symbol: 'USDC', name: 'USD Coin', address: 'EQB-MPwr', decimals: 6, color: '#2775CA', price: 1.0 },
    tvl: 9800000, volume24h: 4200000, apr: 6.2, fee: 0.05, isStable: true,
  },
  {
    address: 'EQPool4',
    token0: { symbol: 'TON', name: 'Toncoin', address: 'native', decimals: 9, color: '#0098EA', price: 3.21 },
    token1: { symbol: 'NOT', name: 'Notcoin', address: 'EQAvlWFD', decimals: 9, color: '#F5A623', price: 0.0081 },
    tvl: 5600000, volume24h: 1800000, apr: 42.1, fee: 0.3, isFarming: true,
  },
];

// ─── Fallback token list ───────────────────────────────────────────────────────
export const FALLBACK_TOKENS: Token[] = [
  { symbol: 'TON', name: 'Toncoin', address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c', decimals: 9, price: 3.21, priceChange24h: 2.4, color: '#0098EA', balance: '0.070044' },
  { symbol: 'STON', name: 'STON', address: 'EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmn32llxF', decimals: 9, price: 0.21, priceChange24h: -1.2, color: '#2E86AB', balance: '0' },
  { symbol: 'USDT', name: 'Tether USD', address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', decimals: 6, price: 1.0, priceChange24h: 0.01, color: '#26A17B', balance: '2.40' },
  { symbol: 'USDC', name: 'USD Coin', address: 'EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728', decimals: 6, price: 1.0, priceChange24h: 0.00, color: '#2775CA', balance: '0' },
  { symbol: 'NOT', name: 'Notcoin', address: 'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT', decimals: 9, price: 0.0081, priceChange24h: 5.3, color: '#F5A623', balance: '0' },
  { symbol: 'GRAM', name: 'GRAM', address: 'EQBhqTkqheCqLLsNixZzxRFqvEZCqK0d_vIZfXlGRWYfPvVi', decimals: 9, price: 0.043, priceChange24h: -0.8, color: '#8B5CF6', balance: '0' },
  { symbol: 'BOLT', name: 'BOLT', address: 'EQD0vdSA_NedR9uvbgN9EikRX-suesDxGeFg69XQMavfLqIw', decimals: 9, price: 0.0012, priceChange24h: 12.1, color: '#EF4444', balance: '0' },
];
