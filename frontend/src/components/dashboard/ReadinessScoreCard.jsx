import { Link } from 'react-router-dom';
import './ReadinessScoreCard.css';

export default function ReadinessScoreCard({ data }) {
  if (!data) return null;

  if (data.score === null) {
    return (
      <div className="page-card readiness-card readiness-card--empty">
        <p className="readiness-card__empty-title">Your readiness score isn't ready yet.</p>
        <ul className="readiness-card__reasons">
          {data.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
        <Link to="/interviews/new" className="readiness-card__cta">
          Log an interview experience →
        </Link>
      </div>
    );
  }

  return (
    <div className="page-card readiness-card">
      <div className="readiness-card__top">
        <div>
          <p className="readiness-card__eyebrow">Interview Readiness</p>
          <p className="readiness-card__score">{data.score}%</p>
        </div>
      </div>

      <div className="readiness-card__breakdown">
        {data.breakdown.map((c) => (
          <div key={c.key} className="readiness-card__row">
            <span className="readiness-card__row-label">{c.label}</span>
            {c.available ? (
              <>
                <div className="readiness-card__bar-track">
                  <div className="readiness-card__bar-fill" style={{ width: `${c.value}%` }} />
                </div>
                <span className="readiness-card__row-value">{c.value}%</span>
              </>
            ) : (
              <span className="readiness-card__row-unavailable">Not enough data</span>
            )}
          </div>
        ))}
      </div>

      {data.penalty > 0 ? (
        <p className="readiness-card__penalty-note">
          −{data.penalty} points for unresolved recurring patterns (see Pattern Analysis)
        </p>
      ) : null}

      {data.reasons?.length > 0 ? (
        <ul className="readiness-card__reasons readiness-card__reasons--secondary">
          {data.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
