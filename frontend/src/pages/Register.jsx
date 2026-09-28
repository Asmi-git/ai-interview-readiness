import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import FormField from '../components/common/FormField';
import Button from '../components/common/Button';
import Banner from '../components/common/Banner';
import { useAuth } from '../context/AuthContext';
import '../components/common/FormField.css';
import '../components/common/Button.css';
import '../components/common/Banner.css';
import './AuthForm.css';

function validate({ email, password }) {
  const errors = {};
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  } else if (!/\d/.test(password)) {
    errors.password = 'Password must include at least one number.';
  }
  return errors;
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      if (err.fieldErrors) {
        const mapped = {};
        err.fieldErrors.forEach((fe) => {
          mapped[fe.field] = fe.message;
        });
        setFieldErrors(mapped);
      } else {
        setFormError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="For students & fresh graduates"
      headline="Every interview leaves a clue. We help you read it."
      subcopy="Log your interview experiences and Prepwise finds the patterns behind the outcomes — so you know exactly what to fix before the next one."
    >
      <header className="auth-form__header">
        <h2 className="auth-form__title">Create your account</h2>
        <p className="auth-form__meta">Free to use, runs on your own device.</p>
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
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange('password')}
          error={fieldErrors.password}
          hint={!fieldErrors.password ? 'At least 8 characters, including one number.' : undefined}
        />
        <Button type="submit" isLoading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="auth-form__footer">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
