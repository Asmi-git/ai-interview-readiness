export default function QuickStats({ stats }) {
  return (
    <div className="quick-stats">
      {stats.map((s) => (
        <div key={s.label} className="quick-stats__item page-card">
          <p className="quick-stats__value">{s.value}</p>
          <p className="quick-stats__label">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
