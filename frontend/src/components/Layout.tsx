import { Link } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-900 font-quantico text-zinc-200">
      <header className="border-b border-border sticky top-0 z-10 bg-surface-900/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold tracking-tight text-white hover:text-accent transition-colors">
            Data Labeling
          </Link>
          <WalletMultiButton className="!font-quantico !bg-surface-600 !border !border-border-bright hover:!bg-surface-500 !rounded !text-sm !h-9 !px-4" />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
