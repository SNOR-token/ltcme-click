/** Static mainnet indicator — LTCme.click is mainnet only. */
export function NetworkToggle() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      Litecoin Mainnet
    </span>
  );
}
