'use client';

// Inline control the trainer attaches after a confirmed correction to work history.
// Two ways out of the same problem — a stale recruiter card: type the new role, or
// re-upload the CV. The form exists for the common case where someone changes job
// months before their CV catches up.

import { useState, useEffect } from 'react';
import { usePlatformT } from '@/context/platform-i18n';
import CvUpload from './CvUpload';

interface WorkEntry {
  company?: string;
  role?: string;
  end_date?: string;
}

interface Props {
  onSaved: (message?: string) => void;
}

const OPEN_ENDED = new Set([
  '', 'present', 'presente', 'actual', 'actualidad', 'current', 'now',
  'attuale', 'oggi', 'atual', 'hoje', 'hoy', 'ongoing',
]);

const isOpenEnded = (v: unknown) =>
  typeof v !== 'string' || OPEN_ENDED.has(v.trim().toLowerCase());

export default function RoleUpdate({ onSaved }: Props) {
  const t = usePlatformT();
  const [company,   setCompany]   = useState('');
  const [role,      setRole]      = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');
  const [isCurrent, setIsCurrent] = useState(true);
  const [prevEnd,   setPrevEnd]   = useState('');
  const [openRole,  setOpenRole]  = useState<WorkEntry | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [showCv,    setShowCv]    = useState(false);

  // Find the role they are still shown as holding, so the optional "when did that
  // end?" field can name it instead of asking in the abstract.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/training/cv');
        if (!res.ok) return;
        const { cvData } = await res.json() as { cvData: { work_history?: WorkEntry[] } | null };
        const open = (cvData?.work_history ?? []).find(e => isOpenEnded(e.end_date));
        if (!cancelled && open) setOpenRole(open);
      } catch { /* the field is optional — no CV read, no field */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const canSave = !!company.trim() && !!role.trim() && !!startDate.trim() && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/training/current-role', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          company:           company.trim(),
          role:              role.trim(),
          start_date:        startDate.trim(),
          end_date:          isCurrent ? '' : endDate.trim(),
          // Only meaningful when the new role is the current one.
          previous_end_date: isCurrent ? prevEnd.trim() : '',
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? t.role_failed);
        return;
      }
      onSaved(t.role_saved_msg);
    } catch {
      setError(t.role_failed);
    } finally {
      setSaving(false);
    }
  }

  if (showCv) {
    return <CvUpload cvLoaded onSaved={(_, msg) => onSaved(msg)} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[rgba(255,255,255,0.4)] leading-relaxed">
        {t.role_intro}
      </p>

      <Field label={t.role_company} value={company}   onChange={setCompany} />
      <Field label={t.role_title}   value={role}      onChange={setRole} />
      <Field label={t.role_start}   value={startDate} onChange={setStartDate} />

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isCurrent}
          onChange={e => setIsCurrent(e.target.checked)}
          className="accent-[#4060d0]"
        />
        <span className="text-xs text-[rgba(255,255,255,0.6)]">{t.role_current}</span>
      </label>

      {!isCurrent && (
        <Field label={t.role_end} value={endDate} onChange={setEndDate} />
      )}

      {/* Only when they'd otherwise be left holding two open-ended roles at once.
          Blank is a valid answer: some people genuinely hold both. */}
      {isCurrent && openRole?.company && (
        <Field
          label={`${t.role_prev_end(openRole.company)} (${t.role_optional})`}
          value={prevEnd}
          onChange={setPrevEnd}
        />
      )}

      {error && <p className="text-[11px] text-[#c04040]">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="px-4 py-2 rounded-lg text-xs font-medium text-white transition-opacity disabled:opacity-30"
          style={{ background: '#4060d0' }}
        >
          {saving ? t.role_saving : t.role_save}
        </button>
        <button
          onClick={() => setShowCv(true)}
          className="text-[11px] text-[rgba(255,255,255,0.35)] hover:text-white transition-colors underline underline-offset-2"
        >
          {t.role_or_cv}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.3)]">
        {label}
      </span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg bg-white/[0.05] border border-white/[0.09] px-3 py-2
                   text-xs text-white focus:outline-none focus:border-[#4060d0]/60"
      />
    </label>
  );
}
