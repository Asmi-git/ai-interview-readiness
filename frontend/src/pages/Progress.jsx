import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import Banner from '../components/common/Banner';
import PageLoader from '../components/common/PageLoader';
import MonthlyComparisonCard from '../components/dashboard/MonthlyComparisonCard';
import ReadinessTrendChart from '../components/dashboard/ReadinessTrendChart';
import { fetchMonthlyProgress } from '../api/progressApi';
import '../components/common/Banner.css';
import '../components/common/PageLoader.css';
import '../components/dashboard/MonthlyComparisonCard.css';
import '../styles/cards.css';
import './Dashboard.css';
import './Progress.css';

export default function Progress() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchMonthlyProgress()
      .then((body) => {
        if (!cancelled) setData(body);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell title="Progress">
      <header className="page-header">
        <h1 className="page-header__title">Progress over time</h1>
        <p className="page-header__subtitle">
          A snapshot of your readiness is recorded each month you use Prepwise, so you can see whether you're
          improving, stable, or need to adjust your preparation.
        </p>
      </header>

      <Banner tone="error">{error}</Banner>

      {data === null ? (
        <PageLoader label="Loading your progress history…" />
      ) : data.snapshots.length === 0 ? (
        <div className="page-card progress-empty">
          <p className="progress-empty__title">No progress history yet.</p>
          <p className="progress-empty__body">
            Visit your Dashboard to record this month's snapshot — check back next month to see your first comparison.
          </p>
          <Link to="/" className="progress-empty__link">
            Go to Dashboard →
          </Link>
        </div>
      ) : (
        <>
          <div className="page-card progress-trend-card">
            <h2 className="chart-card__title">Readiness trend</h2>
            <ReadinessTrendChart snapshots={data.snapshots} />
          </div>

          {data.comparison ? (
            <MonthlyComparisonCard comparison={data.comparison} />
          ) : (
            <div className="page-card progress-empty">
              <p className="progress-empty__title">Only one month of data so far.</p>
              <p className="progress-empty__body">
                A month-to-month comparison will appear here automatically once a second month is recorded.
              </p>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
