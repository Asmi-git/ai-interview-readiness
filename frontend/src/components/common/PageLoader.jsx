export default function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="page-loader">
      <span className="page-loader__spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
