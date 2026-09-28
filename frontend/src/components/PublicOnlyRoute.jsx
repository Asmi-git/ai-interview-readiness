import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Keeps a logged-in user from landing back on /login or /register. */
export default function PublicOnlyRoute({ children }) {
  const { user, isCheckingSession } = useAuth();

  if (isCheckingSession) return null;
  if (user) return <Navigate to="/" replace />;

  return children;
}
