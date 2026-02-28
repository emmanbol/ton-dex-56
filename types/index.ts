export interface Token {
  symbol: string;
  name: string;
  address: string; // TON jetton address (or "native" for TON)
  decimals: number;
  price?: number;
  priceChange24h?: number;
  balance?: string;
  logoUrl?: string;
  color: string;
}

export interface Pool {
  address: string;
  token0: Token;
  token1: Token;
  tvl: number;
  volume24h: number;
  apr: number;
  fee: number;
  lpTotalSupply?: string;
  myLpBalance?: string;
  myLiquidity?: number;
  isStable?: boolean;
  isFarming?: boolean;
}

export interface StakePosition {
  id: string;
  amount: number;
  months: number;
  startDate: string;
  gemston: number;
  arkenston: number;
  claimable: number;
  progress: number;
  nftAddress?: string;
}

export interface SwapSimulation {
  offerAmount: string;
  askAmount: string;
  priceImpact: string;
  minAskAmount: string;
  feeAmount: string;
  routerAddress: string;
  poolAddress: string;
}

export interface Proposal {
  id: number;
  title: string;
  description: string;
  status: 'Active' | 'Passed' | 'Failed';
  yes: number;
  no: number;
  endsAt: string;
  quorum: number;
}
