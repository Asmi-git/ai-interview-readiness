import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import Button from '../components/common/Button';
import Banner from '../components/common/Banner';
import PageLoader from '../components/common/PageLoader';
import { getInterview, deleteInterview } from '../api/interviewApi';
import '../components/common/Button.css';
import '../components/common/Banner.css';
import '../components/common/PageLoader.css';
import '../styles/cards.css';
import './InterviewDetail.css';

const RESULT_LABEL = { selected: 'Selected', rejected: 'Rejected', pending: 'Pending' };

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function Row({ label, value }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="detail-row">
      <span className="detail-row__label">{label}</span>
      <span className="detail-row__value">{value}</span>
    </div>
  );
}

export default function InterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getInterview(id)
      .then((body) => {
        if (!cancelled) setInterview(body.interview);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteInterview(id);
      navigate('/interviews', { replace: true });
    } catch (err) {
      setError(err.message);
      setIsDeleting(false);
    }
  };

  return (
    <AppShell title="Interview details">
      <Link to="/interviews" className="detail-back-link">
        ← Back to interviews
      </Link>

      <Banner tone="error">{error}</Banner>

      {!interview ? (
        <PageLoader label="Loading interview…" />
      ) : (
        <div className="page-card">
          <div className="detail-header">
            <div>
              <h1 className="detail-header__company">{interview.companyName}</h1>
              <p className="detail-header__meta">
                {formatDate(interview.date)} · {interview.interviewType} · {interview.interviewRound}
              </p>
            </div>
            <span className={`interview-card__badge interview-card__badge--${interview.result}`}>
              {RESULT_LABEL[interview.result]}
            </span>
          </div>

          <h2 className="skill-section-title skill-section-title--spaced">Performance ratings</h2>
          <Row label="Technical" value={`${interview.technicalPerformance} / 5`} />
          <Row label="Communication" value={`${interview.communicationPerformance} / 5`} />
          <Row label="Confidence" value={`${interview.confidenceLevel} / 5`} />
          <Row label="Project explanation" value={`${interview.projectExplanationPerformance} / 5`} />

          {interview.struggleAreas?.length > 0 && (
            <>
              <h2 className="skill-section-title skill-section-title--spaced">Struggle areas</h2>
              <div className="interview-card__tags">
                {interview.struggleAreas.map((area) => (
                  <span key={area} className="interview-card__tag">
                    {area}
                  </span>
                ))}
              </div>
            </>
          )}

          {interview.struggleReasons?.length > 0 && (
            <>
              <h2 className="skill-section-title skill-section-title--spaced">Why it happened</h2>
              <div className="interview-card__tags">
                {interview.struggleReasons.map((reason) => (
                  <span key={reason} className="interview-card__tag">
                    {reason}
                  </span>
                ))}
              </div>
            </>
          )}

          {interview.description && (
            <>
              <h2 className="skill-section-title skill-section-title--spaced">Description</h2>
              <p className="detail-freetext">{interview.description}</p>
            </>
          )}

          {interview.interviewerFeedback && (
            <>
              <h2 className="skill-section-title skill-section-title--spaced">Interviewer feedback</h2>
              <p className="detail-freetext">{interview.interviewerFeedback}</p>
            </>
          )}

          <div className="detail-actions">
            <Link to={`/interviews/${id}/edit`}>
              <Button variant="secondary" fullWidth={false}>
                Edit
              </Button>
            </Link>
            {confirmingDelete ? (
              <>
                <span className="detail-actions__confirm-text">Delete this interview? This can't be undone.</span>
                <Button variant="primary" fullWidth={false} isLoading={isDeleting} onClick={handleDelete}>
                  Yes, delete
                </Button>
                <Button variant="secondary" fullWidth={false} onClick={() => setConfirmingDelete(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="secondary" fullWidth={false} onClick={() => setConfirmingDelete(true)}>
                Delete
              </Button>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
