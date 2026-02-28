'use client';

import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';
import { Icons } from '@/components/ui/Icons';
import { truncateAddress } from '@/components/ui/index';
import { PageType } from "@/types/page";

//const NAV_TABS = ['Swap', 'Pools', 'Stake', 'Spotlight', 'DAO'];


const NAV_TABS: PageType[] = [
  'Swap',
  'Pools',
  'Stake',
  'Spotlight',
  'DAO',
];

/*interface NavbarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}*/

interface NavbarProps {
  activePage: PageType;
  setActivePage: (page: PageType) => void;
}

function StonLogo() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30">
      <polygon points="15,2 27,9 27,23 15,30 3,23 3,9" fill="#0098EA" opacity="0.18"/>
      <polygon points="15,5 24,10.5 24,21.5 15,27 6,21.5 6,10.5" fill="none" stroke="#0098EA" strokeWidth="1.8"/>
      <circle cx="15" cy="15" r="4.5" fill="#0098EA"/>
    </svg>
  );
}

export function Navbar({ activePage, setActivePage }: NavbarProps) {
  const wallet = useTonWallet();

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(0,0,0,0.07)',
      boxShadow: '0 1px 12px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 20px',
        display: 'flex', alignItems: 'center', gap: 24, height: 64,
      }}>
        {/* Logo */}
        <button
          onClick={() => setActivePage('Swap')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
        >
          <StonLogo />
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px', color: '#111' }}>VooDEX</span>
        </button>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', flex: 1, borderBottom: '0' }}>
          {NAV_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActivePage(tab)}
              style={{
                /*background: 'none', border: 'none',*/
                padding: '8px 14px',
                cursor: 'pointer', fontSize: 14,
                fontWeight: activePage === tab ? 700 : 500,
                color: activePage === tab ? '#0098EA' : '#555',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all .15s',
                fontFamily: 'inherit',
                background: activePage === tab ? '#EFF6FF' : 'transparent',
              }}
            >
              {tab === 'Spotlight' && (
                <svg width="13" height="13" viewBox="0 0 13 13">
                  <path d="M6.5 1l1.5 4h4l-3.3 2.4 1.3 4L6.5 9l-3.5 2.4 1.3-4L1 5h4z" fill="currentColor"/>
                </svg>
              )}
              {tab}
              {tab === 'Spotlight' && (
                <span style={{ background: '#0098EA', color: 'white', fontSize: 10, padding: '1px 6px', borderRadius: 8, fontWeight: 700 }}>
                  New
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Right side: TonConnect button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* TonConnectButton renders the official TON wallet connect modal */}
          <TonConnectButton />

          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: 6, borderRadius: 8, display: 'flex' }}
          >
            {Icons.menu}
          </button>
        </div>
      </div>
    </nav>
  );
}
