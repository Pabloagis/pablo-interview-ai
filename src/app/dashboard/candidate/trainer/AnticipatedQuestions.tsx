'use client';

// Anticipated questions — ONE list, pending and answered together.
//
// Framing throughout: "a recruiter will ask this — how do YOU answer?"
// There is deliberately NO AI-suggested answer to accept, and no answer box here:
// answering happens in the trainer chat, the same surface as everything else the
// candidate says. This panel only shows the questions and their state; the row is
// a way INTO the conversation, not a second place to write.

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

const PENDING_COLOR = '#c08840';
const QUALITY_COLOR: Record<string, string> = { verified: '#3ec870', solid: '#5580f0' };

interface Props {
  loading:        boolean;
  proposed:       ProposedGap[];          // already sorted, most urgent first
  stored:         StoredAnticipated[];
  answeringTopic: string | null;          // the row being answered in the chat right now
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
        <p className="text-[11px] text-white/25">{t.ant_scanning}</p>
      </div>
    );
  }

  const total = proposed.length + stored.length;
  if (total === 0) return null;

  return (
    <div className="w-full flex flex-col gap-3">
      <Header answered={stored.length} total={total} />
      <p className="text-[11px] text-white/40 leading-relaxed -mt-1">
        {proposed.length === 0 ? t.ant_all_answered : t.ant_intro}
      </p>

      <div className="flex flex-col gap-2">
        {/* Pending — most urgent first. Clicking asks it in the chat. */}
        {proposed.map(gap => {
          const isActive = answeringTopic === gap.topic;
          return (
            <button
              key={gap.topic}
              onClick={() => onAnswer(gap)}
              className="w-full text-left rounded-xl border px-4 py-3 flex flex-col gap-1.5 transition-colors"
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
                <span className="text-[10px] shrink-0" style={{ color: PENDING_COLOR }}>
                  {t.ant_answer_cta} →
                </span>
              </div>
              <p className="text-xs font-semibold text-white/85 leading-relaxed">
                {gapQuestion(gap, t)}
              </p>
              <p className="text-[11px] text-white/45 leading-relaxed">
                {gapRationale(gap, t)}
              </p>
            </button>
          );
        })}

        {/* Answered — same list, same row shape. Click to read what you said. */}
        {stored.map(item => {
          const color  = QUALITY_COLOR[item.quality] ?? QUALITY_COLOR.solid;
          const isOpen = expanded === item.id;
          return (
            <div
              key={item.id}
              className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 flex flex-col gap-1.5"
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
                    className="shrink-0 text-white/30 transition-transform"
                    style={{ transform: isOpen ? 'rotate(90deg)' : undefined }}
                  >
                    <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-white/75 leading-relaxed">
                  {topicQuestion(item.topic, t)}
                </p>
              </button>

              {isOpen && (
                <>
                  <p className="text-[11px] text-white/50 leading-relaxed">{item.answer}</p>
                  <button
                    onClick={() => onRemove(item)}
                    className="self-start text-[10px] text-white/30 hover:text-white/70 transition-colors"
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

// ── Bits ──────────────────────────────────────────────────────────────────────

function Header({ answered, total }: { answered: number; total: number }) {
  const t = usePlatformT();
  return (
    <div className="flex items-baseline gap-2">
      <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">
        {t.ant_section}
      </p>
      {total > 0 && (
        <span className="text-[10px] text-white/25 tabular-nums">
          {t.ant_progress(answered, total)}
        </span>
      )}
    </div>
  );
}

function StatusChip({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded shrink-0"
      style={{ color, background: `${color}18` }}
    >
      {label}
    </span>
  );
}
