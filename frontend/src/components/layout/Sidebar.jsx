import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import './Sidebar.css';

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/', enabled: true },
  { label: 'Profile', to: '/profile', enabled: true },
  { label: 'Preparation', to: '/preparation', enabled: true },
  { label: 'Interviews', to: '/interviews', enabled: true },
  { label: 'Pattern Analysis', to: '/patterns', enabled: true },
  { label: 'Recommendations', to: '/recommendations', enabled: true },
  { label: 'Progress', to: '/progress', enabled: true },
  { label: 'Settings', to: '/settings', enabled: true },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/* Backdrop only shows on mobile when the drawer is open */}
      {isOpen ? <div className="sidebar-backdrop" onClick={onClose} /> : null}

      <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <span className="sidebar__mark">P</span>
          Prepwise
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) =>
            item.enabled ? (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
              >
                {item.label}
              </NavLink>
            ) : (
              <span key={item.to} className="sidebar__link sidebar__link--disabled">
                {item.label}
                <span className="sidebar__badge">Soon</span>
              </span>
            )
          )}
        </nav>

        <div className="sidebar__footer">
          <p className="sidebar__user">{user?.email}</p>
          <Button variant="secondary" fullWidth onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </aside>
    </>
  );
}
