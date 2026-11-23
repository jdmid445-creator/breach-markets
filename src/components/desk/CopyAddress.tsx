"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyAddress({ address }: { address: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(address);
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        } catch {}
      }}
      className="press fig inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-mist hover:bg-reef hover:text-fg"
      aria-label={done ? "Address copied" : "Copy wallet address"}
    >
      {address.slice(0, 6)}…{address.slice(-4)}
      {done ? <Check size={13} className="text-up" /> : <Copy size={13} />}
    </button>
  );
}
