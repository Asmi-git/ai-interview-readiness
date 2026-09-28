import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import Button from '../components/common/Button';
import Banner from '../components/common/Banner';
import PageLoader from '../components/common/PageLoader';
import { listRecommendations, dismissRecommendation } from '../api/recommendationApi';
import { listPatterns } from '../api/patternApi';
import '../components/common/Button.css';
import '../components/common/Banner.css';
import '../components/common/PageLoader.css';
import '../styles/cards.css';
import './Recommendations.css';

const PRIORITY_META = {
  high: { label: 'High priority', className: 'recommendation-card__priority--high' },
  medium: { label: 'Medium priority', className: 'recommendation-card__priority--medium' },
  low: { label: 'Low priority', className: 'recommendation-card__priority--low' },
};

const TREND_LABEL = {
  increasing: 'getting more frequent',
  decreasing: 'improving',
  stable: 'stable',
  insufficient_data: 'not enough data yet',
};

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState(null);
  const [patterns, setPatterns] = useState(null);
  const [totalInterviews, setTotalInterviews] = useState(0);
  const [error, setError] = useState('');
  const [dismissingId, setDismissingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listRecommendations(), listPatterns()])
      .then(([recsBody, patternsBody]) => {
        if (cancelled) return;
        setRecommendations(recsBody.recommendations);
        setPatterns(patternsBody.patterns);
        setTotalInterviews(patternsBody.totalInterviews);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDismiss = async (id) => {
    setDismissingId(id);
    try {
      await dismissRecommendation(id);
      setRecommendations((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDismissingId(null);
    }
  };

  return (
    <AppShell title="Recommendations">
      <header className="page-header">
        <h1 className="page-header__title">Personalized recommendations</h1>
        <p className="page-header__subtitle">
          Generated from your recurring patterns — not generic advice. As patterns change, these update too.
        </p>
      </header>

      <Banner tone="error">{error}</Banner>

      {recommendations === null ? (
        <PageLoader label="Loading your recommendations…" />
      ) : recommendations.length === 0 ? (
        <div className="page-card recommendation-empty">
          <p className="recommendation-empty__title">No recommendations yet.</p>
          <p className="recommendation-empty__body">
            Recommendations appear once Prepwise detects a recurring pattern across at least 2 interviews.
          </p>
          <Link to="/interviews/new" className="recommendation-empty__link">
            Log another interview experience →
          </Link>
        </div>
      ) : (
        <div className="recommendation-list">
          {recommendations.map((rec) => {
            const priority = PRIORITY_META[rec.priority] || PRIORITY_META.medium;
            const matchingPattern = patterns?.find((p) => p.category === rec.patternCategory);
            return (
              <div key={rec._id} className="page-card recommendation-card">
                <div className="recommendation-card__top">
                  <h2 className="recommendation-card__category">{rec.patternCategory}</h2>
                  <span className={`recommendation-card__priority ${priority.className}`}>{priority.label}</span>
                </div>
                {matchingPattern ? (
                  <p className="recommendation-card__why">
                    Why: detected in {matchingPattern.frequency} of {totalInterviews} interviews · trend:{' '}
                    {TREND_LABEL[matchingPattern.trend] || matchingPattern.trend}
                  </p>
                ) : null}
                <p className="recommendation-card__text">{rec.recommendationText}</p>
                <Button
                  variant="secondary"
                  fullWidth={false}
                  isLoading={dismissingId === rec._id}
                  onClick={() => handleDismiss(rec._id)}
                >
                  Dismiss
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
