export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  isLoading = false,
  disabled = false,
  onClick,
  fullWidth = true,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`btn btn--${variant}${fullWidth ? ' btn--full' : ''}`}
    >
      {isLoading ? <span className="btn__spinner" aria-hidden="true" /> : null}
      <span>{isLoading ? 'Please wait…' : children}</span>
    </button>
  );
}
