/** Subset of folder swatch backgrounds — IDs match backend `watchlist_swatches.py`. */
const SWATCH_CLASS: Record<string, string> = {
  slate: "from-slate-600/25 to-slate-900/40",
  sage: "from-emerald-700/20 to-slate-900/45",
  lavender: "from-violet-600/25 to-slate-900/40",
  teal: "from-teal-600/25 to-slate-900/40",
  sand: "from-amber-700/20 to-slate-900/45",
  rose: "from-rose-600/25 to-slate-900/40",
  ocean: "from-sky-700/25 to-slate-900/40",
  mauve: "from-fuchsia-700/20 to-slate-900/45",
  "sig-aurora": "from-indigo-500/30 via-violet-600/20 to-slate-900/50",
  "sig-cascade": "from-cyan-600/25 to-indigo-900/45",
};

export function watchlistSwatchClass(swatchId: string): string {
  return SWATCH_CLASS[swatchId] ?? SWATCH_CLASS.slate;
}
