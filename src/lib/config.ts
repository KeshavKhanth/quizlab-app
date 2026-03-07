/**
 * Base URL for quiz data (manifest, JSON, images).
 *
 * - Set NEXT_PUBLIC_DATA_URL in .env.local to point at S3/R2.
 * - Leave it empty to fall back to the local /data/ directory.
 */
export const DATA_BASE_URL: string =
    process.env.NEXT_PUBLIC_DATA_URL?.replace(/\/+$/, "") || "/data";
