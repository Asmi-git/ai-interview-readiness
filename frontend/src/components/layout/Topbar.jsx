import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import './AppShell.css';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="topbar__mark">P</span>
        Prepwise
      </div>
      <div className="topbar__right">
        <span className="topbar__user">{user?.email}</span>
        <Button variant="secondary" fullWidth={false} onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </header>
  );
}
