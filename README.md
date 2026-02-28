# STON.fi DEX Replica

A full-featured replica of [app.ston.fi](https://app.ston.fi) built with **Next.js 14**, **TonConnect**, and the **STON.fi API**.

---

"npm install --legacy-peer-deps --verbose" can be used for installations that seem to show
errors while installing with regular "npm install"

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure your app URL

Edit `public/tonconnect-manifest.json`:
```json
{
  "url": "https://YOUR-DOMAIN.com",
  "name": "STON.fi DEX",
  "iconUrl": "https://YOUR-DOMAIN.com/icon.png"
}
```

Also update `components/shared/Providers.tsx`:
```tsx
const MANIFEST_URL = 'https://YOUR-DOMAIN.com/tonconnect-manifest.json';
```

> ⚠️ **Important**: TonConnect requires an HTTPS URL. During local dev, use [ngrok](https://ngrok.com) or [localtunnel](https://localtunnel.me) to expose localhost.

### 3. Run dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔌 Real Blockchain Integration

### Wallet Connection (TonConnect)
Wallet connection is **fully live** via `@tonconnect/ui-react`. The `<TonConnectButton />` in the navbar opens the official TON wallet selector (Tonkeeper, MyTonWallet, TON Space, etc.)

### STON.fi API (Live Data)
The app fetches real data from STON.fi via `@ston-fi/api`:

| Feature | Status | File |
|---------|--------|------|
| Token list | ✅ Live | `hooks/useStonfi.ts` |
| Token prices | ✅ Live | `hooks/useStonfi.ts` |
| Pool list + TVL/APR | ✅ Live | `hooks/useStonfi.ts` |
| Swap simulation | ✅ Live | `hooks/useStonfi.ts` |
| Wallet balances | ✅ Live (when connected) | `hooks/useStonfi.ts` |

### Sending Real Transactions
Transactions use the `@ston-fi/sdk` Router to build proper TON transaction payloads. To enable **real swaps**, update `components/swap/SwapPage.tsx`:

```typescript
import { DEX, pTON } from '@ston-fi/sdk';
import { TonClient } from '@ton/ton';

const client = new TonClient({ endpoint: 'https://toncenter.com/api/v2/jsonRPC' });

// Build swap transaction
const router = client.open(new DEX.v2_2.Router.CPI(...routerAddress));
const txParams = await router.buildSwapTonToJettonTxParams({
  userWalletAddress: wallet.account.address,
  proxyTon: new pTON.v2_1(),
  askJettonAddress: recvToken.address,
  offerAmount: toNano(sendAmount),
  minAskAmount: toNano(minReceived, recvToken.decimals),
});

await tonConnectUI.sendTransaction({
  validUntil: Math.floor(Date.now() / 1000) + 600,
  messages: [{ address: txParams.to.toString(), amount: txParams.value.toString(), payload: txParams.body?.toBoc().toString('base64') }],
});
```

---

## 📁 Project Structure

```
stonfi-dex/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   └── page.tsx            # Entry point
├── components/
│   ├── DEXApp.tsx          # Main app orchestrator
│   ├── shared/
│   │   ├── Providers.tsx   # TonConnect + Toast providers
│   │   ├── Navbar.tsx      # Nav with real TonConnectButton
│   │   └── OtherPages.tsx  # Spotlight + DAO pages
│   ├── swap/
│   │   ├── SwapPage.tsx    # Full swap UI + API integration
│   │   └── TokenModal.tsx  # Token selector with live search
│   ├── pools/
│   │   └── PoolsPage.tsx   # Pools + Add Liquidity modal
│   ├── stake/
│   │   └── StakePage.tsx   # Staking with NFT positions
│   └── ui/
│       ├── index.tsx       # Shared UI components
│       └── Icons.tsx       # SVG icon library
├── hooks/
│   └── useStonfi.ts        # SWR hooks for STON.fi API
├── lib/
│   ├── stonfi.ts           # API client + helpers
│   └── store.ts            # Zustand state management
├── types/
│   └── index.ts            # TypeScript types
├── styles/
│   └── globals.css         # Global styles + Tailwind
└── public/
    └── tonconnect-manifest.json  # Required for wallet connect
```

---

## 🌐 Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set env var
vercel env add NEXT_PUBLIC_APP_URL
# Enter: https://your-app.vercel.app
```

After deploying, update `tonconnect-manifest.json` with your real Vercel URL.

---

## 🔧 Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_TON_NETWORK=mainnet  # or testnet
```

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `@tonconnect/ui-react` | Official TON wallet connection |
| `@ston-fi/api` | STON.fi REST API client (prices, pools, swap simulation) |
| `@ston-fi/sdk` | STON.fi smart contract SDK (building transactions) |
| `@ton/ton` | TON blockchain client |
| `swr` | Data fetching with auto-refresh |
| `zustand` | Lightweight state management |
| `react-hot-toast` | Toast notifications |
| `next` | React framework |

---

## 💡 Features

- ✅ **Swap Page** — Live token list, real swap simulation, slippage control, Omniston toggle
- ✅ **Pools Page** — Live pool data (TVL, APR, Volume), sortable, Add Liquidity flow
- ✅ **Stake Page** — Duration picker, reward preview, NFT position tracking
- ✅ **Spotlight** — Featured farms with APR & deadlines
- ✅ **DAO** — Proposals with live voting (wallet-gated)
- ✅ **TonConnect** — Real wallet modal (Tonkeeper, TON Space, MyTonWallet, etc.)
- ✅ **Auto-refresh** — Prices refresh every 30s, pools every 60s
- ✅ **Toast notifications** — Success/error feedback on all actions
- ✅ **Fallback data** — Shows mock data if API is unavailable

---

## 📄 License

MIT — Replica for educational and development purposes.
