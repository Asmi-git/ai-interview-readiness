export default function CheckboxGroup({ label, options, selected, onToggle, hint, error }) {
  return (
    <div className="form-field">
      <span className="form-field__label">{label}</span>
      {hint ? <p className="form-field__hint form-field__hint--spaced">{hint}</p> : null}
      <div className="checkbox-group" role="group" aria-label={label}>
        {options.map((option) => {
          const isChecked = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              aria-pressed={isChecked}
              className={`checkbox-group__tag${isChecked ? ' checkbox-group__tag--checked' : ''}`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="form-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
