'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import LogoutButton from '../LogoutButton';
import type { CandidateDirectoryItem } from '@/app/api/recruiter/candidates/route';
import type { SessionHistoryItem } from '@/app/api/recruiter/sessions/route';

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 61 ? '#60c080' : score >= 31 ? '#4060d0' : '#6080a0';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-[rgba(255,255,255,0.07)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-[11px] tabular-nums text-[rgba(255,255,255,0.4)] w-7 text-right">
        {score}%
      </span>
    </div>
  );
}

type PublishLevel = 'basic' | 'solid' | 'sharp' | 'unpublished';

const LEVEL_COLOR: Record<PublishLevel, string> = {
  sharp:       '#60c080',
  solid:       '#5080f0',
  basic:       '#4060d0',
  unpublished: '#6080a0',
};

const LEVEL_LABEL: Record<PublishLevel, string> = {
  sharp:       'Sharp',
  solid:       'Solid',
  basic:       'Basic',
  unpublished: 'Unpublished',
};

function PublishLevelBadge({ level }: { level: PublishLevel }) {
  const color = LEVEL_COLOR[level];
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest"
      style={{ color, background: `${color}1a` }}
    >
      {LEVEL_LABEL[level]}
    </span>
  );
}

function SkillChip({ label }: { label: string }) {
  return (
    <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium bg-[rgba(64,96,208,0.12)] border border-[rgba(64,96,208,0.2)] text-[rgba(160,180,255,0.8)]">
      {label}
    </span>
  );
}

function CandidateCard({
  candidate,
  onInterview,
  loading,
}: {
  candidate: CandidateDirectoryItem;
  onInterview: (id: string) => void;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5 flex flex-col gap-4 hover:border-[rgba(255,255,255,0.13)] transition-colors">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-white leading-snug">
            {candidate.full_name}
          </p>
          <PublishLevelBadge level={(candidate.publish_level as PublishLevel) ?? 'basic'} />
        </div>
        {candidate.current_role && (
          <p className="text-xs text-[rgba(255,255,255,0.45)] mt-0.5">
            {candidate.current_role}
            {candidate.years_experience > 0 && (
              <span className="text-[rgba(255,255,255,0.28)]">
                {' '}· {candidate.years_experience}y exp
              </span>
            )}
          </p>
        )}
      </div>

      {/* Score */}
      <div>
        <p className="text-[10px] font-semibold text-[rgba(255,255,255,0.28)] uppercase tracking-widest mb-1.5">
          Twin Confidence
        </p>
        <ScoreBar score={candidate.confidence_score} />
      </div>

      {/* Skills */}
      {candidate.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {candidate.skills.slice(0, 3).map(skill => (
            <SkillChip key={skill} label={skill} />
          ))}
        </div>
      )}

      {/* Career goal */}
      {candidate.career_goal && (
        <p className="text-xs text-[rgba(255,255,255,0.35)] leading-relaxed line-clamp-1">
          {candidate.career_goal}
        </p>
      )}

      {/* Action */}
      <button
        onClick={() => onInterview(candidate.id)}
        disabled={loading}
        className="mt-auto w-full py-2 rounded-xl bg-[#4060d0] hover:bg-[#3050c0] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
      >
        {loading && (
          <div className="w-3.5 h-3.5 rounded-full border-2 border-t-white/30 border-white animate-spin" />
        )}
        {loading ? 'Starting…' : 'Interview'}
      </button>
    </div>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
    <div className="col-span-2 py-16 text-center">
      {search ? (
        <>
          <p className="text-sm font-medium text-white mb-1">No results for "{search}"</p>
          <p className="text-xs text-[rgba(255,255,255,0.35)]">
            Try a different name, role, or skill.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-white mb-1">No candidates published yet</p>
          <p className="text-xs text-[rgba(255,255,255,0.35)]">
            Candidates appear here once they've published their agent — Basic, Solid, or Sharp.
          </p>
        </>
      )}
    </div>
  );
}

function HistoryRow({ session }: { session: SessionHistoryItem }) {
  const date = new Date(session.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <a
      href={`/interview/${session.id}`}
      className="flex items-center justify-between px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.10)] hover:bg-[rgba(255,255,255,0.04)] transition-colors group"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {session.candidate_name}
        </p>
        <p className="text-xs text-[rgba(255,255,255,0.38)] mt-0.5">
          {date}
          {session.company && (
            <span className="text-[rgba(255,255,255,0.25)]"> · {session.company}</span>
          )}
        </p>
      </div>
      <span className="text-xs text-[#6080f0] group-hover:text-white transition-colors shrink-0 ml-4">
        View →
      </span>
    </a>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Tab = 'candidates' | 'history';

interface Props {
  recruiterName: string;
}

export default function RecruiterDashboard({ recruiterName }: Props) {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('candidates');
  const [search, setSearch] = useState('');
  const [candidates, setCandidates] = useState<CandidateDirectoryItem[]>([]);
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [startingSession, setStartingSession] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Load candidates on mount
  useEffect(() => {
    fetch('/api/recruiter/candidates')
      .then(r => r.json())
      .then((data: { candidates?: CandidateDirectoryItem[]; error?: string }) => {
        if (data.candidates) setCandidates(data.candidates);
        else setError(data.error ?? 'Failed to load candidates');
      })
      .catch(() => setError('Failed to load candidates'))
      .finally(() => setLoadingCandidates(false));
  }, []);

  // Load history when tab switches to history
  const loadHistory = useCallback(() => {
    if (loadingHistory) return;
    setLoadingHistory(true);
    fetch('/api/recruiter/sessions')
      .then(r => r.json())
      .then((data: { sessions?: SessionHistoryItem[]; error?: string }) => {
        if (data.sessions) setSessions(data.sessions);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [loadingHistory]);

  useEffect(() => {
    if (tab === 'history' && sessions.length === 0) loadHistory();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side search filter (server already limits to published candidates)
  const filteredCandidates = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return candidates;
    return candidates.filter(c =>
      c.full_name.toLowerCase().includes(q) ||
      c.current_role.toLowerCase().includes(q) ||
      c.career_goal.toLowerCase().includes(q) ||
      c.skills.some(s => s.toLowerCase().includes(q))
    );
  }, [candidates, search]);

  const handleInterview = async (candidateId: string) => {
    setStartingSession(candidateId);
    setError('');
    try {
      const res = await fetch('/api/recruiter/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_id: candidateId }),
      });
      const data = await res.json() as { sessionId?: string; error?: string };
      if (!res.ok || !data.sessionId) {
        setError(data.error ?? 'Failed to start session');
        return;
      }
      router.push(`/interview/${data.sessionId}`);
    } catch {
      setError('Failed to start session. Please try again.');
    } finally {
      setStartingSession(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0d0f14]">

      {/* Top bar */}
      <header className="border-b border-[rgba(255,255,255,0.06)] px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold text-[rgba(255,255,255,0.28)] uppercase tracking-widest">
            InterviewMind
          </p>
          <h1 className="text-base font-bold text-white mt-0.5">
            Find your next hire
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:block text-xs text-[rgba(255,255,255,0.25)]">
            {recruiterName}
          </span>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-[rgba(255,255,255,0.06)] pb-0">
          {(['candidates', 'history'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px',
                tab === t
                  ? 'text-white border-[#4060d0]'
                  : 'text-[rgba(255,255,255,0.38)] border-transparent hover:text-[rgba(255,255,255,0.65)]',
              ].join(' ')}
            >
              {t === 'candidates' ? 'Candidate Directory' : 'Interview History'}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl border border-red-800/40 bg-red-950/20 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ── Candidates tab ── */}
        {tab === 'candidates' && (
          <>
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.25)]"
                  width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth={2}
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name, role, or skill…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-sm text-white placeholder-[rgba(255,255,255,0.25)] focus:outline-none focus:border-[rgba(64,96,208,0.5)] transition-colors"
                />
              </div>
            </div>

            {/* Grid */}
            {loadingCandidates ? (
              <div className="py-16 text-center text-sm text-[rgba(255,255,255,0.35)]">
                <div className="inline-block w-5 h-5 rounded-full border-2 border-t-[#4060d0] border-[rgba(255,255,255,0.1)] animate-spin mb-3" />
                <p>Loading candidates…</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredCandidates.length === 0 ? (
                  <EmptyState search={search} />
                ) : (
                  filteredCandidates.map(candidate => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      onInterview={handleInterview}
                      loading={startingSession === candidate.id}
                    />
                  ))
                )}
              </div>
            )}

            {/* Note: candidates filter already limits to published_at IS NOT NULL — no note needed */}
          </>
        )}

        {/* ── History tab ── */}
        {tab === 'history' && (
          <>
            {loadingHistory ? (
              <div className="py-16 text-center text-sm text-[rgba(255,255,255,0.35)]">
                <div className="inline-block w-5 h-5 rounded-full border-2 border-t-[#4060d0] border-[rgba(255,255,255,0.1)] animate-spin mb-3" />
                <p>Loading history…</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm font-medium text-white mb-1">No interviews yet</p>
                <p className="text-xs text-[rgba(255,255,255,0.35)]">
                  Start an interview from the Candidate Directory — it will appear here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-semibold text-[rgba(255,255,255,0.28)] uppercase tracking-widest mb-2">
                  {sessions.length} interview{sessions.length !== 1 ? 's' : ''}
                </p>
                {sessions.map(session => (
                  <HistoryRow key={session.id} session={session} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
