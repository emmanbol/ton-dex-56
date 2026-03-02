import { SwapForm } from "./components/swap-form";
import { SwapButton } from "./components/swap-button";

export default function SwapPage() {
  return (
    <div style={{ maxWidth: 500, margin: '0 auto', width: '100%' }}>
      <SwapForm />
      <div style={{ marginTop: 12 }}>
        <SwapButton />
        {/*<h1>This is for H1 now</h1>*/}
      </div>
    </div>
  );
}