export function resolveSchwabOAuthLandingPath(
  status: string | null,
): string | null {
  if (!status) return null;

  if (status === "success") {
    return "/portfolio?status=success";
  }

  return `/settings?status=${encodeURIComponent(status)}`;
}
