'use client';

import { useState, useRef } from 'react';
import { usePlatformT, type PlatformStrings } from '@/context/platform-i18n';

// Host-agnostic inline document uploader for the trainer chat. Mirrors CvUpload's
// contract (a plain onSaved callback, no wizard TrainingData) so the chat owns no
// wizard state. Posts to the SAME /api/training/raw-data route the wizard's
// UploadModule uses — this is UI relocation, not a second implementation.
//
// Unlike the CV (one canonical career history → /api/training/cv), supporting
// documents are evidence: references, reviews, work samples, transcripts. Each maps
// to a raw-data source_type so the coverage model can credit the right node
// (e.g. a work sample lights metrics_impact once paired with a result).

interface Props {
  onSaved: (message?: string) => void;
  compact?: boolean;   // tighter padding when shown inside a chat bubble
}

// The candidate picks in plain language; we map to the API's source_type. The label
// is looked up from the translation dictionary at render (labelKey), so the picker
// follows the selected language.
const DOC_KINDS: { value: string; labelKey: keyof PlatformStrings; sourceType: string; artifactType: string | null }[] = [
  { value: 'work_sample',  labelKey: 'doc_kind_work_sample', sourceType: 'professional_artifact', artifactType: 'project' },
  { value: 'reference',    labelKey: 'doc_kind_reference',   sourceType: 'recruiter_feedback',    artifactType: null },
  { value: 'review',       labelKey: 'doc_kind_review',      sourceType: 'recruiter_feedback',    artifactType: null },
  { value: 'transcript',   labelKey: 'doc_kind_transcript',  sourceType: 'interview_transcript',  artifactType: null },
  { value: 'other',        labelKey: 'doc_kind_other',       sourceType: 'free_training',         artifactType: 'other' },
];

// DOCX/DOC are binary with no text layer we can hand Claude — the raw-data route
// rejects them, so don't offer them here. (Export to PDF from Word.)
const ACCEPTED = '.pdf,.txt,.md,.json';

export default function DocumentUpload({ onSaved, compact = false }: Props) {
  const t = usePlatformT();
  const [kind, setKind] = useState(DOC_KINDS[0].value);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError('');
    const meta = DOC_KINDS.find(k => k.value === kind) ?? DOC_KINDS[0];

    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_type', meta.sourceType);
    if (meta.artifactType) formData.append('artifact_type', meta.artifactType);

    try {
      const res = await fetch('/api/training/raw-data', { method: 'POST', body: formData });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? t.doc_failed);
        return;
      }
      onSaved(t.doc_saved(file.name));
    } catch {
      setError(t.doc_failed);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className={`flex flex-col gap-3 ${compact ? '' : 'py-1'}`}>
      <p className="text-xs text-[rgba(255,255,255,0.4)] leading-relaxed">
        {t.doc_intro}
      </p>

      <div>
        <label className="block text-[10px] text-[rgba(255,255,255,0.35)] uppercase tracking-wide mb-1.5">
          {t.doc_what_is_it}
        </label>
        <select
          value={kind}
          onChange={e => setKind(e.target.value)}
          disabled={uploading}
          className="rounded-lg text-xs outline-none w-full"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '0.5px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.7)',
            padding: '7px 10px',
          }}
        >
          {DOC_KINDS.map(k => (
            <option key={k.value} value={k.value} style={{ background: '#161a28' }}>
              {t[k.labelKey] as string}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed transition-colors text-xs"
        style={{
          borderColor: uploading ? 'rgba(64,96,208,0.4)' : 'rgba(255,255,255,0.14)',
          background: uploading ? 'rgba(64,96,208,0.05)' : 'rgba(255,255,255,0.02)',
          color: uploading ? 'rgba(100,130,255,0.8)' : 'rgba(255,255,255,0.4)',
          cursor: uploading ? 'not-allowed' : 'pointer',
        }}
      >
        {uploading ? (
          <>
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="rgba(100,130,255,0.3)" strokeWidth="3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="rgba(100,130,255,0.8)" strokeWidth="3" strokeLinecap="round" />
            </svg>
            {t.doc_reading}
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {t.doc_upload_button}
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
      />

      {error && <p className="text-xs text-[rgba(220,80,80,0.85)]">{error}</p>}
    </div>
  );
}
