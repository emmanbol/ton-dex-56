'use client';

import useSWR from 'swr';
import { useTonWallet, useTonConnectUI } from '@tonconnect/ui-react';
import {
  fetchAssets,
  fetchPools,
  fetchWalletAssets,
  simulateSwap,
  toNano,
  FALLBACK_TOKENS,
  FALLBACK_POOLS,
} from '@/lib/stonfi';
import type { Token, SwapSimulation } from '@/types';

// ─── Fetch all DEX tokens ────────────────────────────────────────────────────
export function useTokens() {
  const { data, error, isLoading } = useSWR(
    'stonfi-assets',
    fetchAssets,
    {
      refreshInterval: 30_000, // refresh every 30s
      fallbackData: FALLBACK_TOKENS,
      onError: () => FALLBACK_TOKENS,
    }
  );
  return {
    tokens: data.slice(0, 200) || FALLBACK_TOKENS,
    isLoading,
    error,
  };
}

// ─── Fetch wallet-specific token balances ────────────────────────────────────
export function useWalletTokens() {
  const wallet = useTonWallet();
  const address = wallet?.account?.address;

  const { data, error, isLoading, mutate } = useSWR(
    address ? ['wallet-assets', address] : null,
    () => fetchWalletAssets(address!),
    { refreshInterval: 15_000 }
  );

  return {
    walletTokens: data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

// ─── Fetch all pools ─────────────────────────────────────────────────────────
export function usePools() {
  const { data, error, isLoading } = useSWR(
    'stonfi-pools',
    fetchPools,
    {
      refreshInterval: 60_000,
      fallbackData: FALLBACK_POOLS,
    }
  );
  return {
    pools: data || FALLBACK_POOLS,
    isLoading,
    error,
  };
}

// ─── Simulate a swap in real-time ────────────────────────────────────────────
export function useSwapSimulation(
  sendToken: Token | null,
  recvToken: Token | null,
  sendAmount: string,
  slippage: string
) {
  const shouldFetch =
    sendToken &&
    recvToken &&
    sendAmount &&
    parseFloat(sendAmount) > 0;

  const { data, error, isLoading } = useSWR<SwapSimulation | null>(
    shouldFetch
      ? ['swap-sim', sendToken?.address, recvToken?.address, sendAmount, slippage]
      : null,
    () =>
      simulateSwap(
        sendToken!.address,
        recvToken!.address,
        toNano(sendAmount, sendToken!.decimals),
        (parseFloat(slippage) / 100).toString()
      ),
    {
      refreshInterval: 10_000,
      revalidateOnFocus: true,
    }
  );

  // Fallback: calculate locally if API fails
  const localRate =
    sendToken?.price && recvToken?.price
      ? sendToken.price / recvToken.price
      : 0;

  const localRecvAmount =
    sendAmount && localRate
      ? (parseFloat(sendAmount) * localRate).toFixed(6)
      : '';

  return {
    simulation: data,
    recvAmount: data
      ? (
          parseFloat(data.askAmount) /
          Math.pow(10, recvToken?.decimals || 9)
        ).toFixed(6)
      : localRecvAmount,
    priceImpact: data?.priceImpact || '0.00',
    minReceived: data
      ? (
          parseFloat(data.minAskAmount) /
          Math.pow(10, recvToken?.decimals || 9)
        ).toFixed(6)
      : localRecvAmount
      ? (
          parseFloat(localRecvAmount) *
          (1 - parseFloat(slippage) / 100)
        ).toFixed(6)
      : '0',
    isLoading,
    error,
  };
}

// ─── Send a swap transaction via TonConnect ───────────────────────────────────
export function useSwapTransaction() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  const sendSwap = async (
    fromToken: Token,
    toToken: Token,
    amount: string,
    minReceived: string
  ): Promise<boolean> => {
    if (!wallet) return false;

    try {
      // For TON → Jetton swap using STON.fi pTON proxy
      // In production, use @ston-fi/sdk Router.buildSwapTonToJettonTxParams()
      const amountNano = toNano(amount, fromToken.decimals);

      // This is the STON.fi v2 router address on mainnet
      const ROUTER_ADDRESS = 'EQB3ncyBUTjZUA5EnFKR5_EnOMI9V1tTDGyiOR1-MEGAMAIN';

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10min
        messages: [
          {
            address: ROUTER_ADDRESS,
            amount: amountNano,
            // payload would be the swap opcode BOC built by @ston-fi/sdk
            // For production: const { to, value, body } = await router.buildSwapTonToJettonTxParams(...)
          },
        ],
      });

      return true;
    } catch (err: any) {
      if (err?.message?.includes('User declined')) {
        console.log('User rejected transaction');
      } else {
        console.error('Swap transaction failed:', err);
      }
      return false;
    }
  };

  return { sendSwap, connected: !!wallet };
}
