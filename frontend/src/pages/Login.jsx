import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import FormField from '../components/common/FormField';
import Button from '../components/common/Button';
import Banner from '../components/common/Banner';
import { useAuth } from '../context/AuthContext';
import '../components/common/FormField.css';
import '../components/common/Button.css';
import '../components/common/Banner.css';
import './AuthForm.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = location.state?.from || '/';

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.email || !form.password) {
      setFieldErrors({
        email: !form.email ? 'Email is required.' : undefined,
        password: !form.password ? 'Password is required.' : undefined,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Welcome back"
      headline="Pick up right where your last interview left off."
      subcopy="Your recurring patterns, readiness score, and recommendations are exactly where you left them."
    >
      <header className="auth-form__header">
        <h2 className="auth-form__title">Sign in</h2>
        <p className="auth-form__meta">Enter your details to access your dashboard.</p>
      </header>

      <Banner tone="error">{formError}</Banner>

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange('email')}
          error={fieldErrors.email}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange('password')}
          error={fieldErrors.password}
        />
        <Button type="submit" isLoading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <p className="auth-form__footer">
        New to Prepwise? <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
