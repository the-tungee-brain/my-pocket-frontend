import Link from "next/link";
import { cn } from "@/lib/utils";

export function SignInLegalNotice({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "max-w-md text-[11px] leading-relaxed text-muted",
        className,
      )}
    >
      By signing in, you agree to our{" "}
      <Link
        href="/terms"
        className="font-medium text-accent-strong hover:underline"
      >
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link
        href="/privacy"
        className="font-medium text-accent-strong hover:underline"
      >
        Privacy Policy
      </Link>
      .
    </p>
  );
}
