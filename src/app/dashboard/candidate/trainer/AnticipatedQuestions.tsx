'use client';

import { useState } from 'react';
import { usePlatformT } from '@/context/platform-i18n';
import type { ProposedGap } from '@/lib/anticipated';
import { gapQuestion, gapRationale, topicQuestion } from './anticipated-copy';

export interface StoredAnticipated {
  id: string;
  topic: string;
  trigger_hint: string;
  answer: string;
  quality: 'solid' | 'verified';
}

const PENDING_COLOR = '#D4A843';  // --warning
const QUALITY_COLOR: Record<string, string> = {
  verified: '#4A9E5C',  // --success
  solid:    '#5B9BF6',  // --interactive
};

interface Props {
  loading:        boolean;
  proposed:       ProposedGap[];
  stored:         StoredAnticipated[];
  answeringTopic: string | null;
  onAnswer:       (gap: ProposedGap) => void;
  onRemove:       (item: StoredAnticipated) => void;
}

export default function AnticipatedQuestions({
  loading,
  proposed,
  stored,
  answeringTopic,
  onAnswer,
  onRemove,
}: Props) {
  const t = usePlatformT();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-2">
        <Header answered={0} total={0} />
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-disabled)]">{t.ant_scanning}</p>
      </div>
    );
  }

  const total = proposed.length + stored.length;
  if (total === 0) return null;

  return (
    <div className="w-full flex flex-col gap-3">
      <Header answered={stored.length} total={total} />
      <p className="text-[var(--body-sm)] text-[var(--text-secondary)] leading-relaxed -mt-1">
        {proposed.length === 0 ? t.ant_all_answered : t.ant_intro}
      </p>

      <div className="flex flex-col gap-2">
        {proposed.map(gap => {
          const isActive = answeringTopic === gap.topic;
          return (
            <button
              key={gap.topic}
              onClick={() => onAnswer(gap)}
              className="w-full text-left rounded-[var(--radius-md)] border px-4 py-3 flex flex-col gap-1.5 transition-colors duration-[180ms]"
              style={{
                borderColor: isActive ? `${PENDING_COLOR}80` : `${PENDING_COLOR}33`,
                background:  isActive ? `${PENDING_COLOR}14` : `${PENDING_COLOR}08`,
              }}
            >
              <div className="flex items-center gap-2">
                <StatusChip
                  color={PENDING_COLOR}
                  label={gap.priority === 1 ? t.ant_priority : t.ant_needs_answer}
                />
                <div className="flex-1 min-w-0" />
                <span className="font-mono text-[10px] uppercase tracking-[0.06em] shrink-0" style={{ color: PENDING_COLOR }}>
                  {t.ant_answer_cta} →
                </span>
              </div>
              <p className="text-[var(--body-sm)] font-medium text-[var(--text-display)] leading-relaxed">
                {gapQuestion(gap, t)}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                {gapRationale(gap, t)}
              </p>
            </button>
          );
        })}

        {stored.map(item => {
          const color  = QUALITY_COLOR[item.quality] ?? QUALITY_COLOR.solid;
          const isOpen = expanded === item.id;
          return (
            <div
              key={item.id}
              className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 flex flex-col gap-1.5"
            >
              <button
                onClick={() => setExpanded(isOpen ? null : item.id)}
                className="w-full text-left flex flex-col gap-1.5"
              >
                <div className="flex items-center gap-2">
                  <StatusChip color={color} label={item.quality} />
                  <div className="flex-1 min-w-0" />
                  <svg
                    width="10" height="10" viewBox="0 0 12 12" fill="none"
                    className="shrink-0 text-[var(--text-disabled)] transition-transform"
                    style={{ transform: isOpen ? 'rotate(90deg)' : undefined }}
                  >
                    <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-[var(--body-sm)] font-medium text-[var(--text-primary)] leading-relaxed">
                  {topicQuestion(item.topic, t)}
                </p>
              </button>

              {isOpen && (
                <>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{item.answer}</p>
                  <button
                    onClick={() => onRemove(item)}
                    className="self-start font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-disabled)] hover:text-[var(--text-primary)] transition-colors duration-[180ms]"
                  >
                    {t.ant_remove}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Header({ answered, total }: { answered: number; total: number }) {
  const t = usePlatformT();
  return (
    <div className="flex items-baseline gap-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-disabled)]">
        {t.ant_section}
      </p>
      {total > 0 && (
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-disabled)] tabular-nums">
          {t.ant_progress(answered, total)}
        </span>
      )}
    </div>
  );
}

function StatusChip({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="font-mono text-[9px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-[var(--radius-sm)] shrink-0"
      style={{ color, background: `${color}18`, border: `1px solid ${color}35` }}
    >
      {label}
    </span>
  );
}
