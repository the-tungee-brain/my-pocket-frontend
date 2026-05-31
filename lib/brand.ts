export type LogoVariant = "crest" | "monogram" | "wordmark";

export const ACTIVE_LOGO_VARIANT: LogoVariant = "crest";

/**
 * Content hash of tomcrest-logo 512.png — update when brand assets change
 * so browsers and Next.js image cache fetch the new files.
 */
export const BRAND_ASSET_VERSION = "1b46322815c1";

function brandAsset(path: string) {
  return `${path}?v=${BRAND_ASSET_VERSION}`;
}

/** Raster brand mark (shield + charts) — synced with tomcrest-logo / iOS BrandLogo. */
export const BRAND_MARK_SRC = brandAsset("/brand/brand-mark.png");
export const BRAND_MARK_SRC_256 = brandAsset("/brand/brand-mark-256.png");
export const BRAND_APP_ICON_512_SRC = brandAsset("/brand/app-icon-512.png");
export const BRAND_APP_ICON_1024_SRC = brandAsset("/brand/app-icon-1024.png");
export const BRAND_APP_ICON_180_SRC = brandAsset("/brand/app-icon-180.png");

export const BRAND_NAME = "Tomcrest";
export const BRAND_TAGLINE = "AI portfolio intelligence";
export const BRAND_SITE_HOST = "tomcrest.com";
export const BRAND_SUPPORT_EMAIL = "support@tomcrest.com";
