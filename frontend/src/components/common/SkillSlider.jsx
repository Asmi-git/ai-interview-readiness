export default function SkillSlider({ id, label, value, onChange, isRated }) {
  return (
    <div className="skill-slider">
      <div className="skill-slider__head">
        <label htmlFor={id} className="skill-slider__label">
          {label}
        </label>
        <span className="skill-slider__value">{isRated ? `${value}%` : 'Not yet rated'}</span>
      </div>
      <input
        id={id}
        type="range"
        min="0"
        max="100"
        step="5"
        value={value}
        onChange={onChange}
        className="skill-slider__input"
      />
    </div>
  );
}
