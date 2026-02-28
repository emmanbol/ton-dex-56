import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Providers } from '@/components/shared/Providers';
//import { Navbar } from '@/components/shared/Navbar';

export const metadata: Metadata = {
  title: 'VooDEX — on TON',
  description: 'Decentralized exchange on the TON blockchain. Swap, provide liquidity, and stake',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'VooDEX',
    description: 'Swap tokens, provide liquidity, and stake on TON',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>

        <Providers>
          {/*<Navbar />*/}
          
          {children}

        </Providers>
      </body>
    </html>
  );
}
