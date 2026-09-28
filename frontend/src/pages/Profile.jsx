import { useEffect, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import FormField from '../components/common/FormField';
import SelectField from '../components/common/SelectField';
import Button from '../components/common/Button';
import Banner from '../components/common/Banner';
import PageLoader from '../components/common/PageLoader';
import { fetchProfile, saveProfile } from '../api/profileApi';
import { useMetaOptions } from '../hooks/useMetaOptions';
import '../components/common/FormField.css';
import '../components/common/Button.css';
import '../components/common/Banner.css';
import '../components/common/PageLoader.css';
import '../styles/cards.css';

const EMPTY_FORM = {
  name: '',
  education: '',
  degree: '',
  experienceLevel: '',
  targetRole: '',
  preferredIndustry: '',
  skills: '', // comma-separated in the UI, split into an array on save
  careerGoal: '',
};

export default function Profile() {
  const { options, isLoading: optionsLoading, error: optionsError } = useMetaOptions();

  const [form, setForm] = useState(EMPTY_FORM);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchProfile()
      .then((body) => {
        if (cancelled) return;
        if (body.profile) {
          setForm({
            name: body.profile.name || '',
            education: body.profile.education || '',
            degree: body.profile.degree || '',
            experienceLevel: body.profile.experienceLevel || '',
            targetRole: body.profile.targetRole || '',
            preferredIndustry: body.profile.preferredIndustry || '',
            skills: (body.profile.skills || []).join(', '),
            careerGoal: body.profile.careerGoal || '',
          });
        }
      })
      .catch((err) => {
        if (!cancelled) setFormError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      const payload = {
        ...form,
        skills: form.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      await saveProfile(payload);
      setSuccessMessage('Profile saved successfully.');
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

  const isLoading = optionsLoading || isProfileLoading;

  return (
    <AppShell title="Profile">
      <header className="page-header">
        <h1 className="page-header__title">Career profile</h1>
        <p className="page-header__subtitle">
          This is used to tailor your readiness score and recommendations to your target role. You can update it any time.
        </p>
      </header>

      <div className="page-card">
        {isLoading ? (
          <PageLoader label="Loading your profile…" />
        ) : optionsError ? (
          <Banner tone="error">{optionsError}</Banner>
        ) : (
          <>
            <Banner tone="error">{formError}</Banner>
            <Banner tone="success">{successMessage}</Banner>

            <form onSubmit={handleSubmit} noValidate>
              <FormField id="name" label="Full name" value={form.name} onChange={handleChange('name')} error={fieldErrors.name} />

              <SelectField
                id="education"
                label="Education level"
                value={form.education}
                onChange={handleChange('education')}
                options={options.educationLevels}
                error={fieldErrors.education}
              />

              <FormField
                id="degree"
                label="Degree"
                value={form.degree}
                onChange={handleChange('degree')}
                error={fieldErrors.degree}
                hint={!fieldErrors.degree ? 'e.g. B.Tech Computer Science' : undefined}
              />

              <SelectField
                id="experienceLevel"
                label="Experience level"
                value={form.experienceLevel}
                onChange={handleChange('experienceLevel')}
                options={options.experienceLevels}
                error={fieldErrors.experienceLevel}
              />

              <SelectField
                id="targetRole"
                label="Target role"
                value={form.targetRole}
                onChange={handleChange('targetRole')}
                options={options.targetRoles}
                error={fieldErrors.targetRole}
              />

              <FormField
                id="preferredIndustry"
                label="Preferred industry"
                value={form.preferredIndustry}
                onChange={handleChange('preferredIndustry')}
                error={fieldErrors.preferredIndustry}
                required={false}
                hint="Optional — e.g. Product companies, Fintech, Consulting"
              />

              <FormField
                id="skills"
                label="Key skills"
                value={form.skills}
                onChange={handleChange('skills')}
                error={fieldErrors.skills}
                required={false}
                hint="Optional — comma-separated, e.g. React, Node.js, SQL"
              />

              <FormField
                id="careerGoal"
                label="Career goal"
                value={form.careerGoal}
                onChange={handleChange('careerGoal')}
                error={fieldErrors.careerGoal}
                required={false}
                hint="Optional — a sentence on what you're aiming for"
              />

              <Button type="submit" isLoading={isSaving} fullWidth={false}>
                Save profile
              </Button>
            </form>
          </>
        )}
      </div>
    </AppShell>
  );
}
