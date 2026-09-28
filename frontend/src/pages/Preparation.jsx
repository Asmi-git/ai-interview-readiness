import { useEffect, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import SkillSlider from '../components/common/SkillSlider';
import Button from '../components/common/Button';
import Banner from '../components/common/Banner';
import PageLoader from '../components/common/PageLoader';
import { fetchSkills, saveSkills } from '../api/skillsApi';
import '../components/common/SkillSlider.css';
import '../components/common/Button.css';
import '../components/common/Banner.css';
import '../components/common/PageLoader.css';
import '../styles/cards.css';

export default function Preparation() {
  const [skills, setSkills] = useState([]); // [{ skillName, category, level, recordedAt }]
  const [levels, setLevels] = useState({}); // { [skillName]: number } - working copy the sliders edit
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchSkills()
      .then((body) => {
        if (cancelled) return;
        setSkills(body.skills);
        const initialLevels = {};
        body.skills.forEach((s) => {
          initialLevels[s.skillName] = s.level ?? 50; // default slider position if never rated
        });
        setLevels(initialLevels);
      })
      .catch((err) => {
        if (!cancelled) setFormError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSliderChange = (skillName) => (e) => {
    setLevels((prev) => ({ ...prev, [skillName]: Number(e.target.value) }));
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      const payload = Object.entries(levels).map(([skillName, level]) => ({ skillName, level }));
      await saveSkills(payload);
      setSuccessMessage('Preparation progress saved.');
      // Reflect the save as "now rated" locally without waiting for a refetch
      setSkills((prev) => prev.map((s) => ({ ...s, level: levels[s.skillName] })));
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const technical = skills.filter((s) => s.category === 'technical');
  const soft = skills.filter((s) => s.category === 'soft');

  return (
    <AppShell title="Preparation">
      <header className="page-header">
        <h1 className="page-header__title">Preparation &amp; skill tracking</h1>
        <p className="page-header__subtitle">
          Rate your current level based on practice or assessments you've completed elsewhere. This app doesn't test you —
          it uses what you record here, alongside your interview experiences, to calculate your readiness.
        </p>
      </header>

      <div className="page-card">
        {isLoading ? (
          <PageLoader label="Loading your preparation levels…" />
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <Banner tone="error">{formError}</Banner>
            <Banner tone="success">{successMessage}</Banner>

            <h2 className="skill-section-title">Technical skills</h2>
            {technical.map((s) => (
              <SkillSlider
                key={s.skillName}
                id={s.skillName}
                label={s.skillName}
                value={levels[s.skillName] ?? 50}
                isRated={s.level !== null}
                onChange={handleSliderChange(s.skillName)}
              />
            ))}

            <h2 className="skill-section-title skill-section-title--spaced">Soft skills</h2>
            {soft.map((s) => (
              <SkillSlider
                key={s.skillName}
                id={s.skillName}
                label={s.skillName}
                value={levels[s.skillName] ?? 50}
                isRated={s.level !== null}
                onChange={handleSliderChange(s.skillName)}
              />
            ))}

            <Button type="submit" isLoading={isSaving} fullWidth={false}>
              Save progress
            </Button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
