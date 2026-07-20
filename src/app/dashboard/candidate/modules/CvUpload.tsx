'use client';

import { useState, useRef } from 'react';

// Host-agnostic: used by both the wizard (Step 1) and the trainer's inline
// onboarding control. Takes a plain boolean rather than the wizard's TrainingData
// so neither host owns it.
interface Props {
  cvLoaded: boolean;
  onSaved: (moduleId: string, message?: string) => void;
}

export default function CvUpload({ cvLoaded, onSaved }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/training/cv', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Upload failed. Please try again.');
        return;
      }
      onSaved(
        'cv',
        "CV processed. Your AI knows your career history. But it doesn't yet know how you think or communicate. The modules below are where the real training happens."
      );
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-[rgba(255,255,255,0.4)] leading-relaxed">
        Upload your CV as a PDF or plain text file. Claude will extract your career history so your
        AI understands your background. (DOCX not supported — export as PDF from Word.)
      </p>

      {/* Upload area */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full flex flex-col items-center gap-2 py-8 rounded-xl border border-dashed transition-colors"
        style={{
          borderColor: uploading ? 'rgba(64,96,208,0.4)' : 'rgba(255,255,255,0.15)',
          background: uploading ? 'rgba(64,96,208,0.05)' : 'rgba(255,255,255,0.02)',
          cursor: uploading ? 'not-allowed' : 'pointer',
        }}
      >
        {uploading ? (
          <>
            <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="rgba(100,130,255,0.3)" strokeWidth="3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="rgba(100,130,255,0.8)" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <span className="text-xs text-[rgba(100,130,255,0.8)]">Extracting with AI…</span>
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span className="text-xs text-[rgba(255,255,255,0.4)]">
              {cvLoaded ? 'Upload a new CV to replace the existing one' : 'Click to upload CV'}
            </span>
            <span className="text-[10px] text-[rgba(255,255,255,0.2)]">PDF · TXT</span>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
      />

      {cvLoaded && !uploading && (
        <div className="flex items-center gap-2 text-xs text-[rgba(96,192,128,0.8)]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          CV on file — your AI knows your career history
        </div>
      )}

      {error && <p className="text-xs text-[rgba(220,80,80,0.85)]">{error}</p>}
    </div>
  );
}
