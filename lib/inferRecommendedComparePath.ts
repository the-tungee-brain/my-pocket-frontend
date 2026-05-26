export type ComparePathKind = "roll" | "close" | "hold";

export function inferRecommendedComparePath(
  actionTitle: string | undefined | null,
): ComparePathKind | null {
  if (!actionTitle?.trim()) return null;
  const title = actionTitle.toLowerCase();
  if (title.includes("roll")) return "roll";
  if (title.includes("close") || title.includes("buy to close")) return "close";
  if (title.includes("hold")) return "hold";
  return null;
}

const PATH_ORDER: ComparePathKind[] = ["roll", "close", "hold"];

export function sortComparePaths<T extends { path: ComparePathKind }>(
  paths: T[],
  recommended: ComparePathKind | null,
): T[] {
  if (!recommended) return paths;
  return [...paths].sort((a, b) => {
    if (a.path === recommended) return -1;
    if (b.path === recommended) return 1;
    return PATH_ORDER.indexOf(a.path) - PATH_ORDER.indexOf(b.path);
  });
}
