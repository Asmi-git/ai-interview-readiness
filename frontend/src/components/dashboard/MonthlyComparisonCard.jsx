function ComparisonRow({ label, from, to, delta, unit = '%', invertGood = false }) {
  if (delta === null) {
    return (
      <div className="comparison-row">
        <span className="comparison-row__label">{label}</span>
        <span className="comparison-row__unavailable">Not enough data</span>
      </div>
    );
  }

  const isGood = invertGood ? delta < 0 : delta > 0;
  const isBad = invertGood ? delta > 0 : delta < 0;
  const sign = delta > 0 ? '+' : '';
  const tone = delta === 0 ? 'neutral' : isGood ? 'good' : isBad ? 'bad' : 'neutral';

  return (
    <div className="comparison-row">
      <span className="comparison-row__label">{label}</span>
      <span className="comparison-row__values">
        {from}
        {unit} → {to}
        {unit}
      </span>
      <span className={`comparison-row__delta comparison-row__delta--${tone}`}>
        {sign}
        {delta}
        {unit}
      </span>
    </div>
  );
}

export default function MonthlyComparisonCard({ comparison }) {
  if (!comparison) return null;

  const patternCategories = Object.keys(comparison.patternCounts);

  return (
    <div className="page-card monthly-comparison">
      <h2 className="monthly-comparison__title">
        {comparison.from} → {comparison.to}
      </h2>

      <ComparisonRow label="Readiness" {...comparison.readiness} />
      <ComparisonRow label="Technical" {...comparison.technical} />
      <ComparisonRow label="Communication" {...comparison.communication} />
      <ComparisonRow label="Confidence" {...comparison.confidence} />
      <ComparisonRow label="Role skill coverage" {...comparison.roleCoverage} />

      {patternCategories.length > 0 ? (
        <>
          <h3 className="monthly-comparison__subtitle">Recurring pattern occurrences</h3>
          {patternCategories.map((category) => (
            <ComparisonRow
              key={category}
              label={category}
              {...comparison.patternCounts[category]}
              unit=""
              invertGood
            />
          ))}
        </>
      ) : null}
    </div>
  );
}
