import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { DM_Sans } from "next/font/google";

import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/toaster";

import { Providers } from "./providers";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VOODEX Exchange",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  noStore();

  return (
    <html lang="en">
      <body className={dmSans.className} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Providers>
          <Header />
          <main style={{ flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto', padding: 'clamp(16px, 4vw, 32px) clamp(12px, 4vw, 24px)' }}>
            {children}
          </main>
          <footer style={{ textAlign: 'center', padding: '20px 16px', color: '#aaa', fontSize: 12, borderTop: '1px solid rgba(0,0,0,.06)', background: 'rgba(255,255,255,.5)' }}>
            <style>{`.footer-link { color: #aaa; text-decoration: none; transition: color .15s; } .footer-link:hover { color: #0098EA; }`}</style>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 6 }}>
              {['Docs', 'Terms', 'Privacy', 'Support'].map(link => (
                <a key={link} href="#" className="footer-link">{link}</a>
              ))}
            </div>
            <div>© {new Date().getFullYear()} VOODEX — Decentralized AMM on TON Blockchain</div>
          </footer>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}