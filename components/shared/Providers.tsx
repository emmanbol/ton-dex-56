'use client';

import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { Toaster } from 'react-hot-toast';

// Replace with your actual deployed URL
/*const MANIFEST_URL =
  process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/tonconnect-manifest.json`
    : 'https://your-stonfi-app.vercel.app/tonconnect-manifest.json';*/

const MANIFEST_URL = "https://guud.online/jettons/tonconnect-manifest-voodex.json"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TonConnectUIProvider
      manifestUrl={MANIFEST_URL}
      actionsConfiguration={{
        twaReturnUrl: 'https://t.me/your_telegram_app', // optional: for Telegram Mini App
      }}
    >
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'DM Sans, system-ui, sans-serif',
            borderRadius: '14px',
            fontSize: '14px',
            fontWeight: 600,
          },
          success: {
            style: {
              background: '#F0FDF4',
              border: '1.5px solid #86EFAC',
              color: '#16A34A',
            },
            iconTheme: { primary: '#22C55E', secondary: 'white' },
          },
          error: {
            style: {
              background: '#FEF2F2',
              border: '1.5px solid #FECACA',
              color: '#DC2626',
            },
            iconTheme: { primary: '#EF4444', secondary: 'white' },
          },
        }}
      />
    </TonConnectUIProvider>
  );
}
