import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import FormField from '../components/common/FormField';
import SelectField from '../components/common/SelectField';
import TextAreaField from '../components/common/TextAreaField';
import CheckboxGroup from '../components/common/CheckboxGroup';
import RatingScale from '../components/common/RatingScale';
import Button from '../components/common/Button';
import Banner from '../components/common/Banner';
import PageLoader from '../components/common/PageLoader';
import { useMetaOptions } from '../hooks/useMetaOptions';
import { getInterview, createInterview, updateInterview } from '../api/interviewApi';
import '../components/common/FormField.css';
import '../components/common/CheckboxGroup.css';
import '../components/common/RatingScale.css';
import '../components/common/Button.css';
import '../components/common/Banner.css';
import '../components/common/PageLoader.css';
import '../styles/cards.css';

const EMPTY_FORM = {
  companyName: '',
  date: '',
  targetRole: '',
  interviewType: '',
  interviewRound: '',
  result: '',
  technicalPerformance: 0,
  communicationPerformance: 0,
  confidenceLevel: 0,
  projectExplanationPerformance: 0,
  struggleAreas: [],
  struggleReasons: [],
  interviewerFeedback: '',
  description: '',
};

function toDateInputValue(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toISOString().slice(0, 10);
}

export default function InterviewForm() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { options, isLoading: optionsLoading, error: optionsError } = useMetaOptions();

  const [form, setForm] = useState(EMPTY_FORM);
  const [isRecordLoading, setIsRecordLoading] = useState(isEditMode);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    getInterview(id)
      .then((body) => {
        if (cancelled) return;
        const iv = body.interview;
        setForm({
          companyName: iv.companyName,
          date: toDateInputValue(iv.date),
          targetRole: iv.targetRole,
          interviewType: iv.interviewType,
          interviewRound: iv.interviewRound,
          result: iv.result,
          technicalPerformance: iv.technicalPerformance,
          communicationPerformance: iv.communicationPerformance,
          confidenceLevel: iv.confidenceLevel,
          projectExplanationPerformance: iv.projectExplanationPerformance,
          struggleAreas: iv.struggleAreas || [],
          struggleReasons: iv.struggleReasons || [],
          interviewerFeedback: iv.interviewerFeedback || '',
          description: iv.description || '',
        });
      })
      .catch((err) => {
        if (!cancelled) setFormError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsRecordLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEditMode]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleRatingChange = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const toggleStruggleArea = (area) => {
    setForm((prev) => ({
      ...prev,
      struggleAreas: prev.struggleAreas.includes(area)
        ? prev.struggleAreas.filter((a) => a !== area)
        : [...prev.struggleAreas, area],
    }));
  };

  const toggleStruggleReason = (reason) => {
    setForm((prev) => ({
      ...prev,
      struggleReasons: prev.struggleReasons.includes(reason)
        ? prev.struggleReasons.filter((r) => r !== reason)
        : [...prev.struggleReasons, reason],
    }));
  };

  const validateClientSide = () => {
    const errors = {};
    if (!form.companyName.trim()) errors.companyName = 'Company/interview name is required.';
    if (!form.date) errors.date = 'Interview date is required.';
    if (!form.targetRole) errors.targetRole = 'Target role is required.';
    if (!form.interviewType) errors.interviewType = 'Please select an interview type.';
    if (!form.interviewRound.trim()) errors.interviewRound = 'Interview round is required.';
    if (!form.result) errors.result = 'Please select a result.';
    ['technicalPerformance', 'communicationPerformance', 'confidenceLevel', 'projectExplanationPerformance'].forEach(
      (field) => {
        if (!form[field]) errors[field] = 'Please select a rating.';
      }
    );
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const errors = validateClientSide();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode) {
        await updateInterview(id, form);
      } else {
        await createInterview(form);
      }
      navigate('/interviews', { replace: true });
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

  const isLoading = optionsLoading || isRecordLoading;

  return (
    <AppShell title={isEditMode ? 'Edit interview' : 'Add interview'}>
      <header className="page-header">
        <h1 className="page-header__title">{isEditMode ? 'Edit interview experience' : 'Log an interview experience'}</h1>
        <p className="page-header__subtitle">
          You don't need to know the exact reason for how it went — just describe what happened.
          Prepwise looks across all your interviews to find the patterns.
        </p>
      </header>

      <div className="page-card">
        {isLoading ? (
          <PageLoader label="Loading…" />
        ) : optionsError ? (
          <Banner tone="error">{optionsError}</Banner>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <Banner tone="error">{formError}</Banner>

            <FormField
              id="companyName"
              label="Company / interview name"
              value={form.companyName}
              onChange={handleChange('companyName')}
              error={fieldErrors.companyName}
            />

            <FormField
              id="date"
              label="Interview date"
              type="date"
              value={form.date}
              onChange={handleChange('date')}
              error={fieldErrors.date}
            />

            <SelectField
              id="targetRole"
              label="Target role"
              value={form.targetRole}
              onChange={handleChange('targetRole')}
              options={options.targetRoles}
              error={fieldErrors.targetRole}
            />

            <SelectField
              id="interviewType"
              label="Interview type"
              value={form.interviewType}
              onChange={handleChange('interviewType')}
              options={options.interviewTypes}
              error={fieldErrors.interviewType}
            />

            <FormField
              id="interviewRound"
              label="Interview round"
              value={form.interviewRound}
              onChange={handleChange('interviewRound')}
              error={fieldErrors.interviewRound}
              hint={!fieldErrors.interviewRound ? 'e.g. Round 1, Final Round' : undefined}
            />

            <SelectField
              id="result"
              label="Result"
              value={form.result}
              onChange={handleChange('result')}
              options={options.interviewResults}
              error={fieldErrors.result}
            />

            <h2 className="skill-section-title skill-section-title--spaced">How did it go?</h2>

            <RatingScale
              id="technicalPerformance"
              label="Technical performance"
              value={form.technicalPerformance}
              onChange={handleRatingChange('technicalPerformance')}
              error={fieldErrors.technicalPerformance}
            />
            <RatingScale
              id="communicationPerformance"
              label="Communication performance"
              value={form.communicationPerformance}
              onChange={handleRatingChange('communicationPerformance')}
              error={fieldErrors.communicationPerformance}
            />
            <RatingScale
              id="confidenceLevel"
              label="Confidence level"
              value={form.confidenceLevel}
              onChange={handleRatingChange('confidenceLevel')}
              error={fieldErrors.confidenceLevel}
            />
            <RatingScale
              id="projectExplanationPerformance"
              label="Project explanation performance"
              value={form.projectExplanationPerformance}
              onChange={handleRatingChange('projectExplanationPerformance')}
              error={fieldErrors.projectExplanationPerformance}
            />

            <CheckboxGroup
              label="Which areas did you struggle with?"
              hint="Select any that apply — this is what Prepwise uses to detect recurring patterns."
              options={options.struggleAreas}
              selected={form.struggleAreas}
              onToggle={toggleStruggleArea}
            />

            <CheckboxGroup
              label="Why did you struggle? (if applicable)"
              hint="This is the specific root cause — different from the topic above. It's what makes your recommendations precise instead of generic."
              options={options.struggleReasons}
              selected={form.struggleReasons}
              onToggle={toggleStruggleReason}
            />

            <TextAreaField
              id="interviewerFeedback"
              label="Interviewer feedback (if any)"
              value={form.interviewerFeedback}
              onChange={handleChange('interviewerFeedback')}
              hint="Optional — anything the interviewer told you directly"
            />

            <TextAreaField
              id="description"
              label="Describe your interview experience"
              value={form.description}
              onChange={handleChange('description')}
              rows={5}
              hint="Optional, but the more detail here, the better the pattern detection will be"
            />

            <div className="form-actions">
              <Button type="submit" isLoading={isSaving} fullWidth={false}>
                {isEditMode ? 'Save changes' : 'Save interview'}
              </Button>
              <Button variant="secondary" fullWidth={false} onClick={() => navigate('/interviews')}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
