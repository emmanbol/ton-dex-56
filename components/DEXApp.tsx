'use client';

import { useState } from 'react';
import { Navbar } from '@/components/shared/Navbar';
import { SwapPage } from '@/components/swap/SwapPage';
import { PoolsPage } from '@/components/pools/PoolsPage';
import { StakePage } from '@/components/stake/StakePage';
import { SpotlightPage, DAOPage } from '@/components/shared/OtherPages';
import { PageType } from "@/types/page";

const PAGE_TABS = ['Swap', 'Pools', 'Stake', 'Spotlight', 'DAO'] as const;
type Page = typeof PAGE_TABS[number];

function BackgroundBlobs() {
  return (
    <>
      <div className="blob" style={{ position: 'fixed', top: -120, left: -120, width: 500, height: 500, borderRadius: '50%', background: 'rgba(0,152,234,0.07)', filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0 }} />
      <div className="blob" style={{ position: 'fixed', bottom: -120, right: -120, width: 500, height: 500, borderRadius: '50%', background: 'rgba(123,97,255,0.07)', filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0, animationDelay: '-4s' }} />
    </>
  );
}

function TabPills({ activePage, setActivePage }: { activePage: Page; setActivePage: (p: Page) => void }) {
  return (
    <div style={{ marginBottom: 24, display: 'flex', gap: 4, background: 'rgba(255,255,255,0.7)', borderRadius: 14, padding: 4, width: 'fit-content', boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
      {PAGE_TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => setActivePage(tab)}
          style={{
            padding: '6px 16px', borderRadius: 11, border: 'none',
            background: activePage === tab ? 'white' : 'transparent',
            color: activePage === tab ? '#0098EA' : '#888',
            fontWeight: activePage === tab ? 700 : 400,
            fontSize: 13, cursor: 'pointer',
            boxShadow: activePage === tab ? '0 1px 8px rgba(0,0,0,.1)' : 'none',
            fontFamily: 'inherit', transition: 'all .15s',
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export function DEXApp() {
  //const [activePage, setActivePage] = useState<Page>('Swap');
  const [activePage, setActivePage] = useState<PageType>("Swap");

  const currentYear = new Date().getFullYear()

  const dBgLinks = ['Docs', 'GitHub', 'Twitter', 'Telegram', 'Blog', 'Audit']

  return (
    <>
      <BackgroundBlobs />

      <Navbar activePage={activePage} setActivePage={setActivePage} />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 60px', position: 'relative', zIndex: 1 }}>
        <TabPills activePage={activePage} setActivePage={setActivePage} />

        {activePage === 'Swap'      && <SwapPage />}
        {activePage === 'Pools'     && <PoolsPage />}
        {activePage === 'Stake'     && <StakePage />}
        {activePage === 'Spotlight' && <SpotlightPage />}
        {activePage === 'DAO'       && <DAOPage />}
      </main>

      <footer style={{ textAlign: 'center', padding: '20px', color: '#aaa', fontSize: 12, borderTop: '1px solid rgba(0,0,0,.06)', background: 'rgba(255,255,255,.5)', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 8, flexWrap: 'wrap' }}>
          {/*dBgLinks.map((l) => (
            <a key={l} href="#" style={{ color: '#888', textDecoration: 'none' }}
              onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#0098EA'; }}
              onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#888'; }}
            >{l}</a>
          ))*/}
        </div>
        <div>© {currentYear*1} VOODEX — Decentralized AMM on TON Blockchain</div>
      </footer>

      {/* Global keyframe styles */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </>
  );
}
