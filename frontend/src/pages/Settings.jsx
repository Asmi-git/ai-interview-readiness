import { useState } from 'react';
import AppShell from '../components/layout/AppShell';
import FormField from '../components/common/FormField';
import Button from '../components/common/Button';
import Banner from '../components/common/Banner';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../api/authApi';
import '../components/common/FormField.css';
import '../components/common/Button.css';
import '../components/common/Banner.css';
import '../styles/cards.css';
import './Settings.css';

const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmNewPassword: '' };

function validate(form) {
  const errors = {};
  if (!form.currentPassword) errors.currentPassword = 'Current password is required.';
  if (form.newPassword.length < 8) {
    errors.newPassword = 'New password must be at least 8 characters.';
  } else if (!/\d/.test(form.newPassword)) {
    errors.newPassword = 'New password must include at least one number.';
  }
  if (form.confirmNewPassword !== form.newPassword) {
    errors.confirmNewPassword = 'Passwords do not match.';
  }
  return errors;
}

export default function Settings() {
  const { user } = useAuth();

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      await changePassword(form);
      setSuccessMessage('Password changed successfully.');
      setForm(EMPTY_FORM);
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
      setIsSaving(false);
    }
  };

  return (
    <AppShell title="Settings">
      <header className="page-header">
        <h1 className="page-header__title">Settings</h1>
        <p className="page-header__subtitle">Manage your account.</p>
      </header>

      <div className="page-card settings-account-card">
        <h2 className="skill-section-title">Account</h2>
        <p className="settings-account-email">{user?.email}</p>
      </div>

      <div className="page-card">
        <h2 className="skill-section-title">Change password</h2>

        <Banner tone="error">{formError}</Banner>
        <Banner tone="success">{successMessage}</Banner>

        <form onSubmit={handleSubmit} noValidate>
          <FormField
            id="currentPassword"
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={handleChange('currentPassword')}
            error={fieldErrors.currentPassword}
          />
          <FormField
            id="newPassword"
            label="New password"
            type="password"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={handleChange('newPassword')}
            error={fieldErrors.newPassword}
            hint={!fieldErrors.newPassword ? 'At least 8 characters, including one number.' : undefined}
          />
          <FormField
            id="confirmNewPassword"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={form.confirmNewPassword}
            onChange={handleChange('confirmNewPassword')}
            error={fieldErrors.confirmNewPassword}
          />
          <Button type="submit" isLoading={isSaving} fullWidth={false}>
            Update password
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
