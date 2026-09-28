/**
 * Labeled input with an inline error message. Used across every auth
 * and (later) data-entry form so validation feels consistent site-wide.
 */
export default function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  hint,
  autoComplete,
  required = true,
}) {
  return (
    <div className="form-field">
      <label htmlFor={id} className="form-field__label">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`form-field__input${error ? ' form-field__input--error' : ''}`}
      />
      {error ? (
        <p id={`${id}-error`} className="form-field__error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="form-field__hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
