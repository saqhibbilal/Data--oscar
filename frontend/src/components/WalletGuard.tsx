import { useWallet } from "@solana/wallet-adapter-react";

export function WalletGuard({ children }: { children: React.ReactNode }) {
  const { connected } = useWallet();

  if (!connected) {
    return (
      <div className="rounded-lg border border-border bg-surface-800 p-8 text-center">
        <p className="text-zinc-400 mb-2">Connect your wallet to view tasks and submit labels.</p>
        <p className="text-sm text-zinc-500">Use the button above to connect Phantom.</p>
      </div>
    );
  }

  return <>{children}</>;
}
