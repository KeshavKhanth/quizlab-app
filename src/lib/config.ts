/**
 * Base URL for quiz images (S3 bucket or Cloudfront or Cloudflare R2).
 *
 */
export const NEXT_PUBLIC_IMAGE_URL: string =
    process.env.NEXT_PUBLIC_IMAGE_URL?.replace(/\/+$/, "") || "/data";
