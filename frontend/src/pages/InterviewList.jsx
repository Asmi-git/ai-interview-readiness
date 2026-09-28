import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import Button from '../components/common/Button';
import Banner from '../components/common/Banner';
import PageLoader from '../components/common/PageLoader';
import { listInterviews } from '../api/interviewApi';
import '../components/common/Button.css';
import '../components/common/Banner.css';
import '../components/common/PageLoader.css';
import '../styles/cards.css';
import './InterviewList.css';

const RESULT_LABEL = { selected: 'Selected', rejected: 'Rejected', pending: 'Pending' };

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function InterviewList() {
  const [interviews, setInterviews] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    listInterviews()
      .then((body) => {
        if (!cancelled) setInterviews(body.interviews);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell title="Interviews">
      <header className="page-header interview-list__header">
        <div>
          <h1 className="page-header__title">Interview experiences</h1>
          <p className="page-header__subtitle">
            Every interview you log here helps Prepwise detect recurring patterns across your experiences.
          </p>
        </div>
        <Link to="/interviews/new">
          <Button fullWidth={false}>+ Add interview</Button>
        </Link>
      </header>

      <Banner tone="error">{error}</Banner>

      {interviews === null ? (
        <PageLoader label="Loading your interviews…" />
      ) : interviews.length === 0 ? (
        <div className="page-card interview-list__empty">
          <p className="interview-list__empty-title">No interview experiences yet.</p>
          <p className="interview-list__empty-body">
            Add your first interview to start identifying patterns. The more you log, the more useful
            your readiness score and recommendations become.
          </p>
          <Link to="/interviews/new">
            <Button fullWidth={false}>Add your first interview</Button>
          </Link>
        </div>
      ) : (
        <div className="interview-list">
          {interviews.map((iv) => (
            <Link key={iv._id} to={`/interviews/${iv._id}`} className="interview-card">
              <div className="interview-card__top">
                <h2 className="interview-card__company">{iv.companyName}</h2>
                <span className={`interview-card__badge interview-card__badge--${iv.result}`}>
                  {RESULT_LABEL[iv.result]}
                </span>
              </div>
              <p className="interview-card__meta">
                {formatDate(iv.date)} · {iv.interviewType} · {iv.interviewRound}
              </p>
              {iv.struggleAreas?.length > 0 ? (
                <div className="interview-card__tags">
                  {iv.struggleAreas.map((area) => (
                    <span key={area} className="interview-card__tag">
                      {area}
                    </span>
                  ))}
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
