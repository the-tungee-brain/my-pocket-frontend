import Image from "next/image";
import { cn } from "@/lib/utils";
import { BRAND_MARK_SRC, type LogoVariant } from "@/lib/brand";

type TomcrestMarkProps = {
  variant?: LogoVariant;
  className?: string;
};

/** App shield mark — PNG from tomcrest-logo (crest / monogram / wordmark share one raster). */
export function TomcrestMark({ className }: TomcrestMarkProps) {
  return (
    <Image
      src={BRAND_MARK_SRC}
      alt=""
      width={512}
      height={512}
      unoptimized
      className={cn("shrink-0 object-contain", className)}
      aria-hidden
    />
  );
}
