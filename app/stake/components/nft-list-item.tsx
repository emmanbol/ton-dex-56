"use client";

import { useTonConnectUI } from "@tonconnect/ui-react";
import { useBlockchainExplorer } from "@/hooks/use-blockchain-explorer";
import { Formatter } from "@/lib/formatter";
import { Icons } from "@/components/ui/Icons";

import { buildDestroyNftMessage } from "../actions/build-destroy-nft-message";
import { buildUnstakeNftMessage } from "../actions/build-unstake-nft-message";
import type { StakeNft } from "../actions/get-wallet-stake-info";
import { StakeNftStatus } from "../constants";

export function NftListItem({ nft }: { nft: StakeNft }) {
  const [tonConnectUI] = useTonConnectUI();
  const blockchainExplorer = useBlockchainExplorer();

  const canUnstake = nft.minUnstakingTimestamp <= new Date();
  const isActive = nft.status === StakeNftStatus.Active;

  return (
    <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <img src={nft.imageUrl} alt="NFT" style={{ width: 56, height: 56, borderRadius: 12, flexShrink: 0, objectFit: 'cover' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <a
              href={blockchainExplorer.contract(nft.address)}
              target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0098EA', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}
            >
              {Formatter.address(nft.address)}
              {Icons.external}
            </a>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>
              {isActive ? '🔒 Locked until' : '✅ Unstaked'}
              {' '}{nft.minUnstakingTimestamp.toLocaleDateString()}
            </div>
          </div>
          <div style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700, background: isActive ? '#EFF6FF' : '#F0FDF4', color: isActive ? '#0098EA' : '#16A34A' }}>
            {isActive ? 'Active' : 'Unstaked'}
          </div>
        </div>

        <div style={{ background: '#f7f9fc', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 12, color: '#888' }}>{isActive ? 'Staked' : 'Ex. staked'}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{Formatter.units(nft.stakedTokens, 9)} STON</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#888' }}>GEMSTON earned</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED' }}>{Formatter.units(nft.mintedGemston, 9)} GEM</span>
          </div>
        </div>
      </div>

      {/* Action footer */}
      <div style={{ padding: '0 18px 16px' }}>
        {nft.status === StakeNftStatus.Unstaked && (
          <button
            style={{ width: '100%', padding: '10px 0', background: 'none', border: '1.5px solid #eee', borderRadius: 12, color: '#666', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            onClick={async () => {
              const message = await buildDestroyNftMessage(nft.address);
              await tonConnectUI.sendTransaction({ validUntil: Math.floor(Date.now() / 1000) + 300, messages: [message] });
            }}
          >
            Destroy NFT
          </button>
        )}
        {nft.status === StakeNftStatus.Active && (
          canUnstake ? (
            <button
              style={{ width: '100%', padding: '10px 0', background: 'linear-gradient(135deg,#0098EA,#0077BB)', border: 'none', borderRadius: 12, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              onClick={async () => {
                const message = await buildUnstakeNftMessage(nft.address);
                await tonConnectUI.sendTransaction({ validUntil: Math.floor(Date.now() / 1000) + 300, messages: [message] });
              }}
            >
              Unstake NFT
            </button>
          ) : (
            <div style={{ width: '100%', padding: '10px 0', background: '#f0f2f5', borderRadius: 12, color: '#aaa', fontSize: 12, fontWeight: 600, textAlign: 'center', cursor: 'not-allowed' }}>
              🔒 Unlock {nft.minUnstakingTimestamp.toLocaleDateString()}
            </div>
          )
        )}
      </div>
    </div>
  );
}
