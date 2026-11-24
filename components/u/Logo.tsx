/** uplift community logo from public/brand (never redrawn). White version on dark backgrounds. */
export default function Logo({ height = 40, wordmark = false }: { height?: number; wordmark?: boolean }) {
  return <img src={wordmark ? '/brand/uplift-wordmark-white.svg' : '/brand/uplift-logo-white.svg'} alt="uplift community" loading="eager" decoding="async" style={{ height, width: 'auto', display: 'block' }} />;
}
