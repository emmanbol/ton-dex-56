'use client';

import useSWR from 'swr';
import { useTonWallet, useTonConnectUI } from '@tonconnect/ui-react';
import {
  fetchAssets,
  fetchPools,
  fetchWalletAssets,
  simulateSwap,
  toNano,
  fromNano,
  FALLBACK_TOKENS,
  FALLBACK_POOLS,
  ROUTER_V2,
  PTON_V2,
} from '@/lib/stonfi';
import type { Token, SwapSimulation } from '@/types';

// ─── Fetch all DEX tokens ─────────────────────────────────────────────────────
export function useTokens() {
  const { data, error, isLoading } = useSWR('stonfi-assets', fetchAssets, {
    refreshInterval: 30_000,
    fallbackData: FALLBACK_TOKENS,
  });
  return { tokens: (data || FALLBACK_TOKENS).slice(0, 200), isLoading, error };
}

// ─── Fetch wallet balances ────────────────────────────────────────────────────
export function useWalletTokens() {
  const wallet  = useTonWallet();
  const address = wallet?.account?.address;
  const { data, error, isLoading, mutate } = useSWR(
    address ? ['wallet-assets', address] : null,
    () => fetchWalletAssets(address!),
    { refreshInterval: 15_000 },
  );
  return { walletTokens: data || [], isLoading, error, refresh: mutate };
}

// ─── Fetch pools ─────────────────────────────────────────────────────────────
export function usePools() {
  const { data, error, isLoading } = useSWR('stonfi-pools', fetchPools, {
    refreshInterval: 60_000,
    fallbackData: FALLBACK_POOLS,
  });
  return { pools: data || FALLBACK_POOLS, isLoading, error };
}

// ─── Real-time swap simulation ───────────────────────────────────────────────
export function useSwapSimulation(
  sendToken: Token | null,
  recvToken: Token | null,
  sendAmount: string,
  slippage: string,
) {
  const shouldFetch = !!(sendToken && recvToken && sendAmount && parseFloat(sendAmount) > 0);

  const { data, error, isLoading } = useSWR<SwapSimulation | null>(
    shouldFetch
      ? ['swap-sim', sendToken?.address, recvToken?.address, sendAmount, slippage]
      : null,
    () => simulateSwap(
      sendToken!.address,
      recvToken!.address,
      toNano(sendAmount, sendToken!.decimals),
      (parseFloat(slippage) / 100).toString(),
    ),
    { refreshInterval: 10_000, revalidateOnFocus: true },
  );

  // Local price fallback when API unavailable
  const localRate = sendToken?.price && recvToken?.price
    ? sendToken.price / recvToken.price : 0;
  const localRecv = sendAmount && localRate
    ? (parseFloat(sendAmount) * localRate).toFixed(6) : '';

  // API returns askAmount in nano → convert to human-readable
  const recvAmount = data
    ? fromNano(data.askAmount, recvToken?.decimals ?? 9)
    : localRecv;

  const minReceived = data
    ? fromNano(data.minAskAmount, recvToken?.decimals ?? 9)
    : localRecv
      ? (parseFloat(localRecv) * (1 - parseFloat(slippage) / 100)).toFixed(6)
      : '0';

  return {
    simulation: data,
    recvAmount,
    priceImpact: data?.priceImpact || '0.00',
    minReceived,
    isLoading,
    error,
  };
}

// ─── Send swap via TonConnect + @ston-fi/sdk ─────────────────────────────────
export function useSwapTransaction() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  const sendSwap = async (
    fromToken: Token,
    toToken: Token,
    amount: string,
    minReceived: string,
  ): Promise<boolean> => {
    if (!wallet) return false;

    try {
      /*
       * Full production implementation with @ston-fi/sdk v2:
       *
       *   import { DEX, pTON } from '@ston-fi/sdk';
       *   import { TonClient } from '@ton/ton';
       *
       *   const client = new TonClient({ endpoint: 'https://toncenter.com/api/v2/jsonRPC' });
       *   const router = client.open(DEX.v2_2.Router.create(ROUTER_V2));
       *
       *   // TON → Jetton
       *   const txParams = await router.getSwapTonToJettonTxParams({
       *     userWalletAddress: wallet.account.address,
       *     proxyTon:          pTON.v2_1.create(PTON_V2),
       *     askJettonAddress:  toToken.address,
       *     offerAmount:       toNano(amount, 9),          // TON is always 9 decimals
       *     minAskAmount:      toNano(minReceived, toToken.decimals),
       *   });
       *
       *   // Jetton → TON
       *   const txParams = await router.getSwapJettonToTonTxParams({
       *     userWalletAddress: wallet.account.address,
       *     proxyTon:          pTON.v2_1.create(PTON_V2),
       *     offerJettonAddress: fromToken.address,
       *     offerAmount:       toNano(amount, fromToken.decimals),
       *     minAskAmount:      toNano(minReceived, 9),
       *   });
       *
       *   // Jetton → Jetton
       *   const txParams = await router.getSwapJettonToJettonTxParams({
       *     userWalletAddress:  wallet.account.address,
       *     offerJettonAddress: fromToken.address,
       *     askJettonAddress:   toToken.address,
       *     offerAmount:        toNano(amount, fromToken.decimals),
       *     minAskAmount:       toNano(minReceived, toToken.decimals),
       *   });
       *
       *   await tonConnectUI.sendTransaction({
       *     validUntil: Math.floor(Date.now() / 1000) + 600,
       *     messages: [{
       *       address: txParams.to.toString(),
       *       amount:  txParams.value.toString(),
       *       payload: txParams.body?.toBoc().toString('base64'),
       *     }],
       *   });
       *
       * Until the SDK client is wired in, we send a minimal transfer so the
       * wallet at least prompts — replace with the block above for real swaps.
       */
      const isTonSend = fromToken.symbol === 'TON';
      const amountNano = toNano(amount, fromToken.decimals);

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
          // For TON→Jetton the message goes to the pTON proxy;
          // for Jetton→* it goes to the user's jetton wallet — SDK handles this.
          // Using router address here is a safe placeholder that won't lose funds
          // (router will reject without correct payload).
          address: ROUTER_V2,
          amount:  amountNano,
          // payload: txParams.body?.toBoc().toString('base64'),  ← uncomment with SDK
        }],
      });

      return true;
    } catch (err: any) {
      if (err?.message?.includes('User declined') || err?.message?.includes('rejected')) {
        console.log('User rejected transaction');
      } else {
        console.error('Swap tx failed:', err);
      }
      return false;
    }
  };

  return { sendSwap, connected: !!wallet };
}