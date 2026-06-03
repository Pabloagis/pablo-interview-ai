'use client';

import { useState, useRef } from 'react';
import type { TrainingData, RawDataItem } from '../TrainingHub';

interface Props {
  sourceType: string;
  intro: string;
  instructions: string;
  artifactTypes?: { value: string; label: string }[];
  data: TrainingData;
  onSaved: (moduleId: string, message?: string) => void;
  moduleId: string;
  saveMessage?: string;
}

const ACCEPTED_FILE_TYPES = '.pdf,.txt,.md,.json,.docx,.doc';

export default function UploadModule({
  sourceType,
  intro,
  instructions,
  artifactTypes,
  data,
  onSaved,
  moduleId,
  saveMessage,
}: Props) {
  const [pasteText, setPasteText] = useState('');
  const [artifactType, setArtifactType] = useState(artifactTypes?.[0]?.value ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const existing = data.rawData.filter(r => r.source_type === sourceType);

  async function submit(text: string, fileName?: string) {
    if (!text.trim()) return;
    setUploading(true);
    setError('');
    try {
      const res = await fetch('/api/training/raw-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_type: sourceType,
          artifact_type: artifactTypes ? artifactType || null : null,
          raw_text: text.trim(),
          file_name: fileName ?? null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Failed to save. Please try again.');
        return;
      }
      setPasteText('');
      onSaved(moduleId, saveMessage ?? 'Your AI just received new training data.');
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function handleFile(file: File) {
    setUploading(true);
    setError('');
    try {
      const text = await file.text();
      if (!text.trim()) {
        setError('Could not read text from this file.');
        return;
      }
      await submit(text, file.name);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch('/api/training/raw-data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      onSaved(moduleId);
    } catch {
      // non-blocking
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-[rgba(255,255,255,0.4)] leading-relaxed italic">{intro}</p>

      {instructions && (
        <div
          className="rounded-lg p-3 text-[11px] text-[rgba(255,255,255,0.45)] leading-relaxed"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '0.5px solid rgba(255,255,255,0.07)',
            whiteSpace: 'pre-line',
          }}
        >
          {instructions}
        </div>
      )}

      {/* Artifact type selector */}
      {artifactTypes && artifactTypes.length > 0 && (
        <div>
          <label className="block text-[10px] text-[rgba(255,255,255,0.35)] uppercase tracking-wide mb-1.5">
            Type
          </label>
          <select
            value={artifactType}
            onChange={e => setArtifactType(e.target.value)}
            className="rounded-lg text-xs outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '0.5px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.7)',
              padding: '7px 10px',
            }}
          >
            {artifactTypes.map(t => (
              <option key={t.value} value={t.value} style={{ background: '#161a28' }}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Paste area */}
      <div>
        <label className="block text-[10px] text-[rgba(255,255,255,0.35)] uppercase tracking-wide mb-1.5">
          Paste text directly
        </label>
        <textarea
          rows={5}
          value={pasteText}
          onChange={e => { setPasteText(e.target.value); setError(''); }}
          placeholder="Paste content here…"
          className="w-full resize-y rounded-lg text-xs leading-relaxed outline-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '0.5px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.85)',
            padding: '10px 12px',
            minHeight: 100,
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(64,96,208,0.5)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        />
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={() => submit(pasteText)}
            disabled={uploading || !pasteText.trim()}
            className="text-xs px-4 py-2 rounded-lg transition-colors"
            style={{
              background: pasteText.trim() && !uploading ? 'rgba(64,96,208,0.2)' : 'rgba(255,255,255,0.04)',
              border: '0.5px solid rgba(64,96,208,0.3)',
              color: pasteText.trim() && !uploading ? 'rgba(180,200,255,0.9)' : 'rgba(255,255,255,0.2)',
              cursor: pasteText.trim() && !uploading ? 'pointer' : 'not-allowed',
            }}
          >
            {uploading ? 'Saving…' : 'Add'}
          </button>
        </div>
      </div>

      {/* File upload */}
      <div>
        <label className="block text-[10px] text-[rgba(255,255,255,0.35)] uppercase tracking-wide mb-1.5">
          Or upload a file
        </label>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed transition-colors text-xs"
          style={{
            borderColor: 'rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.35)',
            background: 'rgba(255,255,255,0.02)',
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          {uploading ? 'Processing…' : 'Upload file (PDF, TXT, DOCX, JSON)'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
        />
      </div>

      {error && <p className="text-xs text-[rgba(220,80,80,0.85)]">{error}</p>}

      {/* Existing items */}
      {existing.length > 0 && (
        <div>
          <p className="text-[10px] text-[rgba(255,255,255,0.3)] uppercase tracking-wide mb-2">
            Saved ({existing.length})
          </p>
          <div className="flex flex-col gap-1.5">
            {existing.map(item => (
              <div
                key={item.id}
                className="flex items-start gap-2 rounded-lg px-3 py-2"
                style={{
                  background: 'rgba(96,192,128,0.05)',
                  border: '0.5px solid rgba(96,192,128,0.15)',
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(96,192,128,0.7)" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  className="shrink-0 mt-0.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[rgba(255,255,255,0.6)] truncate">
                    {item.file_name ?? (item.raw_text?.slice(0, 60) + '…')}
                  </p>
                  {item.artifact_type && (
                    <p className="text-[10px] text-[rgba(255,255,255,0.25)] capitalize">
                      {item.artifact_type.replace('_', ' ')}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="shrink-0 text-[rgba(255,255,255,0.2)] hover:text-[rgba(220,80,80,0.7)] transition-colors"
                  title="Remove"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
