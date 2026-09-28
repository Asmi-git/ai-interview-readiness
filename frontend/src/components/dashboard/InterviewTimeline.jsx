const RESULT_LABEL = { selected: 'Selected', rejected: 'Rejected', pending: 'Pending' };

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function InterviewTimeline({ interviews }) {
  const sorted = [...interviews].sort((a, b) => new Date(a.date) - new Date(b.date));

  if (sorted.length === 0) return null;

  return (
    <div className="interview-timeline">
      {sorted.map((iv, index) => (
        <div key={iv._id} className="interview-timeline__row">
          <div className="interview-timeline__rail">
            <span className="interview-timeline__dot" />
            {index < sorted.length - 1 ? <span className="interview-timeline__line" /> : null}
          </div>
          <div className="interview-timeline__content">
            <div className="interview-timeline__top">
              <span className="interview-timeline__company">{iv.companyName}</span>
              <span className={`interview-card__badge interview-card__badge--${iv.result}`}>
                {RESULT_LABEL[iv.result]}
              </span>
            </div>
            <p className="interview-timeline__date">{formatDate(iv.date)}</p>
            {iv.struggleAreas?.length > 0 ? (
              <div className="interview-card__tags">
                {iv.struggleAreas.map((area) => (
                  <span key={area} className="interview-card__tag">
                    {area}
                  </span>
                ))}
              </div>
            ) : (
              <p className="interview-timeline__none">No struggle areas recorded</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
