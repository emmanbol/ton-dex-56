import { create } from 'zustand';
import type { Token, Pool, StakePosition } from '@/types';
import { FALLBACK_TOKENS, FALLBACK_POOLS } from '@/lib/stonfi';

interface AppStore {
  // Navigation
  activePage: string;
  setActivePage: (page: string) => void;

  // Tokens
  tokens: Token[];
  setTokens: (tokens: Token[]) => void;
  tokensLoading: boolean;
  setTokensLoading: (loading: boolean) => void;

  // Pools
  pools: Pool[];
  setPools: (pools: Pool[]) => void;
  poolsLoading: boolean;
  setPoolsLoading: (loading: boolean) => void;

  // Swap state
  sendToken: Token;
  recvToken: Token;
  sendAmount: string;
  recvAmount: string;
  slippage: string;
  omniston: boolean;
  setSendToken: (token: Token) => void;
  setRecvToken: (token: Token) => void;
  setSendAmount: (amount: string) => void;
  setRecvAmount: (amount: string) => void;
  setSlippage: (slippage: string) => void;
  setOmniston: (enabled: boolean) => void;
  swapTokens: () => void;

  // Stake positions
  stakePositions: StakePosition[];
  addStakePosition: (position: StakePosition) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Navigation
  activePage: 'Swap',
  setActivePage: (page) => set({ activePage: page }),

  // Tokens
  tokens: FALLBACK_TOKENS,
  setTokens: (tokens) => set({ tokens }),
  tokensLoading: false,
  setTokensLoading: (loading) => set({ tokensLoading: loading }),

  // Pools
  pools: FALLBACK_POOLS,
  setPools: (pools) => set({ pools }),
  poolsLoading: false,
  setPoolsLoading: (loading) => set({ poolsLoading: loading }),

  // Swap state
  sendToken: FALLBACK_TOKENS[0], // TON
  recvToken: FALLBACK_TOKENS[1], // STON
  sendAmount: '',
  recvAmount: '',
  slippage: '0.5',
  omniston: true,
  setSendToken: (token) => set({ sendToken: token }),
  setRecvToken: (token) => set({ recvToken: token }),
  setSendAmount: (amount) => set({ sendAmount: amount }),
  setRecvAmount: (amount) => set({ recvAmount: amount }),
  setSlippage: (slippage) => set({ slippage }),
  setOmniston: (enabled) => set({ omniston: enabled }),
  swapTokens: () => set((state) => ({
    sendToken: state.recvToken,
    recvToken: state.sendToken,
    sendAmount: state.recvAmount,
    recvAmount: state.sendAmount,
  })),

  // Stake
  stakePositions: [
    {
      id: 'demo-1',
      amount: 500,
      months: 12,
      startDate: '2025-08-01',
      gemston: 500,
      arkenston: 500,
      claimable: 24.5,
      progress: 45,
    },
  ],
  addStakePosition: (position) =>
    set((state) => ({ stakePositions: [...state.stakePositions, position] })),
}));
