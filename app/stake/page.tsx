"use client";

import { StakeFormProvider } from "./providers/stake-form";
import { StakeForm } from "./components/stake-form";
import { WalletGuard } from "@/components/wallet-guard";
import { NftList } from "./components/nft-list";
import { StakeNftStatus } from "./constants";

export default function StakePage() {
  return (
    <>
      <StakeFormProvider>
        <StakeForm />
      </StakeFormProvider>

      <WalletGuard
        fallback={null}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 8 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 16, marginTop: 0 }}>Active Positions</h2>
            <NftList
              nftSelector={(nfts) =>
                nfts
                  .filter((nft) => nft.status === StakeNftStatus.Active)
                  .sort((a, b) => a.minUnstakingTimestamp.getTime() - b.minUnstakingTimestamp.getTime())
              }
            />
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 16, marginTop: 0 }}>Unstaked Positions</h3>
            <NftList
              nftSelector={(nfts) =>
                nfts
                  .filter((nft) => nft.status === StakeNftStatus.Unstaked)
                  .sort((a, b) => (a.unstakeTimestamp?.getTime() ?? 0) - (b.unstakeTimestamp?.getTime() ?? 0))
              }
            />
          </div>
        </div>
      </WalletGuard>
    </>
  );
}
