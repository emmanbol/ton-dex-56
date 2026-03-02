"use client";

import { WalletGuard } from "@/components/wallet-guard";
import { VaultClaimParamsForm } from "./components/vault-claim-params-form";
import { VaultList } from "./components/vault-list";
import { VaultClaimParamsProvider } from "./providers";

function VaultPageContentWithWallet() {
  return (
    <VaultClaimParamsProvider>
      <VaultClaimParamsForm />
      <VaultList />
    </VaultClaimParamsProvider>
  );
}

function VaultPageContentWithoutWallet() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: '#aaa' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🔗</div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>Connect your wallet to view vault positions</div>
    </div>
  );
}

export default function VaultPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', margin: '0 0 4px' }}>Vault</h1>
        <p style={{ fontSize: 14, color: '#888', margin: 0 }}>
          Claim accumulated LP fees from your vault positions.{' '}
          <a href="https://docs.ston.fi/docs/developer-section/api-reference-v2/vault" target="_blank" rel="noreferrer"
            style={{ color: '#0098EA' }}>Learn more →</a>
        </p>
      </div>

      <WalletGuard fallback={<VaultPageContentWithoutWallet />}>
        <VaultPageContentWithWallet />
      </WalletGuard>
    </div>
  );
}