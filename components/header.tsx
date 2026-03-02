'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { TonConnectButton } from '@tonconnect/ui-react';
import { useState } from 'react';
import { ROUTES } from '@/constants';
import { useTheme } from '@/components/theme-provider';

const NAV_LINKS = [
  { href: ROUTES.swap,             label: 'Swap' },
  { href: ROUTES.liquidityProvide, label: 'Pools' },
  { href: ROUTES.stake,            label: 'Stake' },
  { href: ROUTES.vault,            label: 'Vault' },
  { href: '/spotlight',            label: 'Spotlight', badge: 'New' },
  { href: '/dao',                  label: 'DAO' },
];

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  const isActive = (href: string) => {
    if (href === ROUTES.swap) return pathname === href || pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--dex-nav-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--dex-nav-border)',
        boxShadow: isDark ? '0 1px 12px rgba(0,0,0,0.3)' : '0 1px 12px rgba(0,0,0,0.04)',
        transition: 'background 0.3s ease',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', height: 60 }}>

          {/* Logo */}
          <Link href={ROUTES.swap} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <Image
              src="/icons/voodex-logo-light.png"
              width={148}
              height={160}
              alt="VOODEX"
              style={{ objectFit: 'contain', height: 44, width: 'auto' }}
            />
          </Link>

          {/* Desktop nav */}
          <div className="desktop-nav" style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 2, marginLeft: 12 }}>
            {NAV_LINKS.map(({ href, label, badge }) => {
              const active = isActive(href);
              return (
                <Link key={href} href={href} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '6px 10px', fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? 'var(--dex-active-color)' : 'var(--dex-text-secondary)',
                  borderRadius: 10,
                  background: active ? 'var(--dex-active-bg)' : 'transparent',
                  textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all 0.15s',
                }}>
                  {label === 'Spotlight' && (
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1.5l1.5 3.5 4 .5-3 2.5 1 4-3.5-2-3.5 2 1-4-3-2.5 4-.5z" fill="currentColor"/>
                    </svg>
                  )}
                  {label}
                  {badge && (
                    <span style={{ background: '#0098EA', color: 'white', fontSize: 9, padding: '1px 5px', borderRadius: 8, fontWeight: 700 }}>
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>

            {/* Dark mode toggle */}
            {/*<button
              onClick={toggle}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--dex-border)',
                background: 'var(--dex-input-bg)', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: 'var(--dex-text-secondary)', transition: 'all 0.2s', flexShrink: 0,
              }}
              onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#0098EA'; (e.currentTarget as HTMLButtonElement).style.color = '#0098EA'; }}
              onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--dex-border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--dex-text-secondary)'; }}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>*/}

            <TonConnectButton />

            {/* Hamburger - mobile only */}
            <button
              className="mobile-menu-btn"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle menu"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--dex-text-secondary)', display: 'none' }}
            >
              {menuOpen ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="mobile-menu" style={{
            borderTop: '1px solid var(--dex-border)',
            background: 'var(--dex-nav-bg)',
            padding: '8px 16px 12px',
          }}>
            {NAV_LINKS.map(({ href, label, badge }) => {
              const active = isActive(href);
              return (
                <Link key={href} href={href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '11px 12px', fontSize: 15,
                    fontWeight: active ? 700 : 500,
                    color: active ? 'var(--dex-active-color)' : 'var(--dex-text-primary)',
                    borderRadius: 12,
                    background: active ? 'var(--dex-active-bg)' : 'transparent',
                    textDecoration: 'none', marginBottom: 2,
                  }}
                >
                  {label}
                  {badge && (
                    <span style={{ background: '#0098EA', color: 'white', fontSize: 10, padding: '1px 6px', borderRadius: 8, fontWeight: 700 }}>
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <style>{`
        @media (max-width: 680px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 681px) {
          .mobile-menu { display: none !important; }
        }
      `}</style>
    </>
  );
}