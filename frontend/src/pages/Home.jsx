import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import Button from '../components/common/Button';
import Banner from '../components/common/Banner';
import ReadinessScoreCard from '../components/dashboard/ReadinessScoreCard';
import SkillProgressChart from '../components/dashboard/SkillProgressChart';
import PatternFrequencyChart from '../components/dashboard/PatternFrequencyChart';
import QuickStats from '../components/dashboard/QuickStats';
import { useAuth } from '../context/AuthContext';
import { fetchReadinessScore } from '../api/readinessApi';
import { listPatterns } from '../api/patternApi';
import { listRecommendations } from '../api/recommendationApi';
import { fetchSkills } from '../api/skillsApi';
import { listInterviews } from '../api/interviewApi';
import { fetchProfile } from '../api/profileApi';
import { downloadReadinessReport } from '../api/reportApi';
import '../components/common/Button.css';
import '../components/common/Banner.css';
import '../components/dashboard/ReadinessScoreCard.css';
import '../styles/cards.css';
import './Dashboard.css';
import './Recommendations.css';

const PRIORITY_META = {
  high: { label: 'High priority', className: 'recommendation-card__priority--high' },
  medium: { label: 'Medium priority', className: 'recommendation-card__priority--medium' },
  low: { label: 'Low priority', className: 'recommendation-card__priority--low' },
};

export default function Home() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.email?.split('@')[0] || '');

  const [readiness, setReadiness] = useState(null);
  const [patterns, setPatterns] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [skills, setSkills] = useState(null);
  const [interviewCount, setInterviewCount] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetchReadinessScore(),
      listPatterns(),
      listRecommendations(),
      fetchSkills(),
      listInterviews(),
      fetchProfile(),
    ])
      .then(([readinessBody, patternsBody, recsBody, skillsBody, interviewsBody, profileBody]) => {
        if (cancelled) return;
        setReadiness(readinessBody);
        setPatterns(patternsBody.patterns);
        setRecommendations(recsBody.recommendations);
        setSkills(skillsBody.skills);
        setInterviewCount(interviewsBody.interviews.length);

        // Prefer the real name from the profile (e.g. "Asmi" from "Asmi Sharma")
        // over the email-derived fallback, once the profile has been filled in.
        const profileName = profileBody.profile?.name?.trim();
        if (profileName) {
          setDisplayName(profileName.split(' ')[0]);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const isLoading = readiness === null && !error;

  return (
    <AppShell title="Dashboard">
      <header className="page-header">
        <h1 className="page-header__title">Welcome back, {displayName}.</h1>
        <p className="page-header__subtitle">
          Everything below is built from what you've actually entered — your preparation levels, interview
          experiences, and the patterns detected across them.
        </p>
      </header>

      <Banner tone="error">{error}</Banner>

      {isLoading ? (
        <p className="chart-empty">Loading your dashboard…</p>
      ) : (
        <>
          <QuickStats
            stats={[
              { label: 'Interviews logged', value: interviewCount ?? 0 },
              { label: 'Patterns detected', value: patterns?.length ?? 0 },
              { label: 'Active recommendations', value: recommendations?.length ?? 0 },
            ]}
          />

          <ReadinessScoreCard data={readiness} />

          {readiness && readiness.score !== null ? (
            <div className="dashboard-report-cta">
              <Button variant="secondary" fullWidth={false} onClick={downloadReadinessReport}>
                Download Readiness Report (PDF)
              </Button>
            </div>
          ) : null}

          <div className="chart-grid">
            <div className="page-card">
              <h2 className="chart-card__title">Preparation progress</h2>
              {skills ? <SkillProgressChart skills={skills} /> : null}
            </div>
            <div className="page-card">
              <h2 className="chart-card__title">Recurring patterns across your interviews</h2>
              {patterns ? <PatternFrequencyChart patterns={patterns} /> : null}
              {patterns && patterns.length > 0 ? (
                <Link to="/patterns" className="dashboard-section-header__link">
                  See why each was detected →
                </Link>
              ) : null}
            </div>
          </div>

          <div className="dashboard-section-header">
            <h2 className="dashboard-section-header__title">Top recommendations</h2>
            <Link to="/recommendations" className="dashboard-section-header__link">
              View all →
            </Link>
          </div>

          {recommendations && recommendations.length > 0 ? (
            <div className="dashboard-recommendation-preview">
              {recommendations.slice(0, 2).map((rec) => {
                const priority = PRIORITY_META[rec.priority] || PRIORITY_META.medium;
                return (
                  <div key={rec._id} className="page-card recommendation-card">
                    <div className="recommendation-card__top">
                      <h3 className="recommendation-card__category">{rec.patternCategory}</h3>
                      <span className={`recommendation-card__priority ${priority.className}`}>{priority.label}</span>
                    </div>
                    <p className="recommendation-card__text">{rec.recommendationText}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="page-card dashboard-recommendation-preview">
              <p className="chart-empty">
                No recommendations yet — they'll appear here once a recurring pattern is detected across at
                least 2 interviews.
              </p>
            </div>
          )}

          <Link to="/interviews/new">
            <Button fullWidth={false}>Log another interview experience</Button>
          </Link>
        </>
      )}
    </AppShell>
  );
}
