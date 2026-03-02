"use client";

import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { useState } from "react";
import { Spinner } from "@/components/ui/dex-ui";
import { useToast } from "@/hooks/use-toast";

import { buildSwapTransaction } from "../actions/build-swap-transaction";
import { useSwapSimulation } from "../hooks/swap-simulation-query";
import { useSwapStatusNotifications } from "../hooks/swap-status-notifications";
import { useSwapStatusQuery } from "../hooks/swap-status-query";
import { useSwapForm } from "../providers/swap-form";
import { useSwapSettings } from "../providers/swap-settings";
import { useSetSwapTransactionDetails } from "../providers/swap-transaction";

export function SwapButton() {
  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const { offerAmount, offerAsset, askAsset, askAmount, referralValue, referralAddress } = useSwapForm();
  const { autoSlippageTolerance } = useSwapSettings();
  const swapSimulationQuery = useSwapSimulation();
  const setSwapTransaction = useSetSwapTransactionDetails();
  const swapStatusQuery = useSwapStatusQuery();
  const [isClicked, setIsClicked] = useState(false);
  const { toast } = useToast();

  useSwapStatusNotifications();

  const handleSwap = async () => {
    if (!swapSimulationQuery.data || !walletAddress) return;
    try {
      const queryId = Date.now();
      setIsClicked(true);
      const messages = await buildSwapTransaction(swapSimulationQuery.data, walletAddress, {
        queryId, referralAddress, referralValue,
        useRecommendedSlippage: autoSlippageTolerance,
      });
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 5 * 60,
        messages,
      });
      toast({ title: "Transaction sent to the network" });
      setSwapTransaction({ queryId, ownerAddress: walletAddress, routerAddress: swapSimulationQuery.data.routerAddress });
    } catch {
      setSwapTransaction(null);
    } finally {
      setIsClicked(false);
    }
  };

  const isDisabled = isClicked || swapSimulationQuery.isFetching || swapStatusQuery.isFetching;

  let label: React.ReactNode = '';
  let disabled = true;
  let variant: 'primary' | 'ghost' | 'danger' = 'primary';

  if (!walletAddress) {
    label = 'Connect wallet to swap';
    variant = 'primary';
    disabled = false;
    // clicking opens modal instead
  } else if (!offerAsset || !askAsset) {
    label = 'Select assets';
    variant = 'ghost';
  } else if (!offerAmount && !askAmount) {
    label = 'Enter an amount';
    variant = 'ghost';
  } else if (swapSimulationQuery.isLoading) {
    label = <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><Spinner size={18} color="white" /> Simulating...</span>;
    variant = 'ghost';
  } else if (!swapSimulationQuery.data) {
    label = 'Invalid swap';
    variant = 'danger';
    disabled = false;
  } else {
    label = isClicked
      ? <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><Spinner size={18} color="white" /> Confirming...</span>
      : `Swap ${offerAsset?.meta?.symbol ?? ''} → ${askAsset?.meta?.symbol ?? ''}`;
    disabled = isDisabled;
    variant = 'primary';
  }

  const baseStyle: React.CSSProperties = {
    width: '100%', padding: 16, fontSize: 16, fontWeight: 700,
    borderRadius: 16, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit', transition: 'all 0.2s',
  };

  const styles: Record<string, React.CSSProperties> = {
    primary: { ...baseStyle, background: disabled ? '#e5e7eb' : 'linear-gradient(135deg,#0098EA,#0077BB)', color: disabled ? '#9ca3af' : 'white', boxShadow: disabled ? 'none' : '0 4px 18px rgba(0,152,234,0.35)' },
    ghost: { ...baseStyle, background: '#f0f2f5', color: '#9ca3af', cursor: 'not-allowed' },
    danger: { ...baseStyle, background: 'linear-gradient(135deg,#EF4444,#DC2626)', color: 'white', boxShadow: '0 4px 14px rgba(239,68,68,0.3)' },
  };

  const handleClick = () => {
    if (!walletAddress) {
      tonConnectUI.openModal();
      return;
    }
    if (!disabled) handleSwap();
  };

  return (
    <button style={styles[variant]} disabled={disabled && !!walletAddress} onClick={handleClick}>
      {label}
    </button>
  );
}
