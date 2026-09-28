import ReadinessPulse from '../common/ReadinessPulse';
import '../common/ReadinessPulse.css';
import './AuthLayout.css';

export default function AuthLayout({ eyebrow, headline, subcopy, children }) {
  return (
    <div className="auth-layout">
      <aside className="auth-layout__brand">
        <div className="auth-layout__brand-inner">
          <div className="auth-layout__wordmark">
            <span className="auth-layout__wordmark-mark">P</span>
            Prepwise
          </div>

          <div className="auth-layout__copy">
            <p className="auth-layout__eyebrow">{eyebrow}</p>
            <h1 className="auth-layout__headline">{headline}</h1>
            <p className="auth-layout__subcopy">{subcopy}</p>
          </div>

          <ReadinessPulse className="auth-layout__pulse" />

          <p className="auth-layout__footnote">
            Built from your own interview experiences — no mock interviews, no guesswork.
          </p>
        </div>
      </aside>

      <main className="auth-layout__form-side">
        <div className="auth-layout__form-card">{children}</div>
      </main>
    </div>
  );
}
