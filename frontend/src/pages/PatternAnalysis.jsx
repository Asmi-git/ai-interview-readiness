import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import Banner from '../components/common/Banner';
import PageLoader from '../components/common/PageLoader';
import InterviewTimeline from '../components/dashboard/InterviewTimeline';
import { listPatterns } from '../api/patternApi';
import { listRecommendations } from '../api/recommendationApi';
import { listInterviews } from '../api/interviewApi';
import '../components/common/Banner.css';
import '../components/common/PageLoader.css';
import '../components/dashboard/InterviewTimeline.css';
import '../styles/cards.css';
import './PatternAnalysis.css';

const TREND_META = {
  increasing: { label: 'Getting more frequent', tone: 'danger' },
  decreasing: { label: 'Improving', tone: 'success' },
  stable: { label: 'Stable', tone: 'neutral' },
  insufficient_data: { label: 'Not enough data yet', tone: 'neutral' },
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function frequencyLabel(freq) {
  if (freq >= 4) return 'High frequency';
  if (freq === 3) return 'Medium frequency';
  return 'Low frequency';
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** The evidence line: which specific interviews contributed to this pattern. */
function Evidence({ pattern, totalInterviews, interviewsById }) {
  const contributing = pattern.interviewIds.map((id) => interviewsById.get(id)).filter(Boolean);

  return (
    <div className="pattern-evidence">
      <p className="pattern-evidence__summary">
        Detected across <strong>{pattern.frequency} of {totalInterviews}</strong> interviews — not from any single one.
      </p>
      {pattern.dominantReason ? (
        <p className="pattern-evidence__reason">Most common reason recorded: "{pattern.dominantReason}"</p>
      ) : null}
      {contributing.length > 0 ? (
        <ul className="pattern-evidence__list">
          {contributing.map((iv) => (
            <li key={iv._id}>
              {iv.companyName} · {formatDate(iv.date)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function PatternAnalysis() {
  const [patterns, setPatterns] = useState(null);
  const [totalInterviews, setTotalInterviews] = useState(0);
  const [recommendations, setRecommendations] = useState(null);
  const [interviews, setInterviews] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([listPatterns(), listRecommendations(), listInterviews()])
      .then(([patternsBody, recsBody, interviewsBody]) => {
        if (cancelled) return;
        setPatterns(patternsBody.patterns);
        setTotalInterviews(patternsBody.totalInterviews);
        setRecommendations(recsBody.recommendations);
        setInterviews(interviewsBody.interviews);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isLoading = patterns === null;
  const interviewsById = new Map((interviews || []).map((iv) => [iv._id, iv]));

  // "Top Priority to Improve": the pattern behind the highest-priority
  // active recommendation — reuses the same priority ranking already
  // computed for Recommendations, rather than re-deriving it here.
  const topRecommendation = recommendations && recommendations.length > 0
    ? [...recommendations].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])[0]
    : null;
  const topPriorityPattern = topRecommendation && patterns
    ? patterns.find((p) => p.category === topRecommendation.patternCategory)
    : null;

  const improvingPatterns = (patterns || []).filter((p) => p.trend === 'decreasing');

  return (
    <AppShell title="Pattern Analysis">
      <header className="page-header">
        <h1 className="page-header__title">Recurring interview patterns</h1>
        <p className="page-header__subtitle">
          This is the core of Prepwise: patterns are only ever detected by looking across <strong>multiple</strong>{' '}
          interviews together — never from a single interview in isolation. A weakness has to show up more than
          once before it's reported here.
        </p>
      </header>

      <Banner tone="error">{error}</Banner>

      {isLoading ? (
        <PageLoader label="Analyzing your interviews…" />
      ) : patterns.length === 0 ? (
        <div className="page-card pattern-empty">
          <p className="pattern-empty__title">No recurring patterns detected yet.</p>
          <p className="pattern-empty__body">
            Patterns need at least 2 interviews describing a similar struggle to show up here. Keep logging your
            interview experiences — this page fills in automatically as you do.
          </p>
          <Link to="/interviews/new" className="pattern-empty__link">
            Log another interview experience →
          </Link>
        </div>
      ) : (
        <>
          {topPriorityPattern ? (
            <div className="page-card top-priority-card">
              <p className="top-priority-card__eyebrow">Top Priority to Improve</p>
              <h2 className="top-priority-card__category">{topPriorityPattern.category}</h2>
              <Evidence pattern={topPriorityPattern} totalInterviews={totalInterviews} interviewsById={interviewsById} />
              <Link to="/recommendations" className="pattern-card__cta">
                See the full recommendation →
              </Link>
            </div>
          ) : null}

          <h2 className="pattern-section-title">All recurring patterns</h2>
          <div className="pattern-list">
            {patterns.map((p) => {
              const trend = TREND_META[p.trend] || TREND_META.stable;
              return (
                <div key={p._id} className="page-card pattern-card">
                  <div className="pattern-card__top">
                    <h3 className="pattern-card__category">{p.category}</h3>
                    <span className="pattern-card__freq-badge">{frequencyLabel(p.frequency)}</span>
                  </div>
                  <p className="pattern-card__detail">
                    Appeared in <strong>{p.frequency}</strong> interview{p.frequency === 1 ? '' : 's'}
                  </p>
                  <div className="pattern-card__trend">
                    <span className={`pattern-card__trend-dot pattern-card__trend-dot--${trend.tone}`} />
                    {trend.label}
                  </div>
                  <Evidence pattern={p} totalInterviews={totalInterviews} interviewsById={interviewsById} />
                  <Link to="/recommendations" className="pattern-card__cta">
                    View recommendation →
                  </Link>
                </div>
              );
            })}
          </div>

          {improvingPatterns.length > 0 ? (
            <>
              <h2 className="pattern-section-title">What Improved</h2>
              <div className="pattern-list">
                {improvingPatterns.map((p) => (
                  <div key={p._id} className="page-card pattern-card pattern-card--improved">
                    <h3 className="pattern-card__category">{p.category}</h3>
                    <p className="pattern-card__detail">
                      Reduced over your recent interviews — now appears in <strong>{p.frequency}</strong> of your most
                      recent ones, down from earlier. See the Progress page for the exact month-to-month numbers.
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          <h2 className="pattern-section-title">Interview Timeline</h2>
          <div className="page-card">
            <InterviewTimeline interviews={interviews} />
          </div>
        </>
      )}
    </AppShell>
  );
}
