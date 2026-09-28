import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import './AppShell.css';

export default function AppShell({ title, children }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isMobileNavOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsMobileNavOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileNavOpen]);

  return (
    <div className="app-shell">
      <Sidebar isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />

      <div className="app-shell__main">
        <header className="app-shell__mobile-topbar">
          <button
            className="app-shell__hamburger"
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Open navigation menu"
          >
            <span />
            <span />
            <span />
          </button>
          <span className="app-shell__mobile-title">{title}</span>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
