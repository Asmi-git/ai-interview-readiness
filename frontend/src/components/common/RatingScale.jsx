const LABELS = { 1: 'Very weak', 2: 'Weak', 3: 'Okay', 4: 'Good', 5: 'Very strong' };

export default function RatingScale({ id, label, value, onChange, error }) {
  return (
    <div className="form-field">
      <span className="form-field__label">{label}</span>
      <div
        className="rating-scale"
        role="radiogroup"
        aria-label={label}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} - ${LABELS[n]}`}
            onClick={() => onChange(n)}
            className={`rating-scale__btn${value === n ? ' rating-scale__btn--selected' : ''}`}
          >
            {n}
          </button>
        ))}
        <span className="rating-scale__hint">{value ? LABELS[value] : 'Select a rating'}</span>
      </div>
      {error ? (
        <p id={`${id}-error`} className="form-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
