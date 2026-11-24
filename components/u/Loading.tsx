import Wash from './Wash';

/** Loading state: the washed background with a quiet pulsing dot (instead of an empty screen). */
export default function Loading({ src }: { src?: string }) {
  return (
    <>
      <Wash src={src} />
      <div role="status" aria-label="Loading" style={{ position: 'fixed', inset: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="u-pulse" />
      </div>
    </>
  );
}
