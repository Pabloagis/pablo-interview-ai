'use client';

export type StepState = 'completed' | 'current' | 'upcoming' | 'needs-evidence';

export interface JourneyStepDef {
  number: number;
  label: string;
  state: StepState;
}

interface Props {
  steps: JourneyStepDef[];
  currentStep: number;
  onStepClick: (step: number) => void;
  confidenceScore: number;
  mobileOpen: boolean;
  onMobileToggle: () => void;
}

const ICON: Record<StepState, string> = {
  completed: '✓',
  current: '●',
  upcoming: '○',
  'needs-evidence': '⚠',
};

const ICON_COLOR: Record<StepState, string> = {
  completed: 'text-green-400',
  current: 'text-[#6080f0]',
  upcoming: 'text-[rgba(255,255,255,0.22)]',
  'needs-evidence': 'text-amber-400',
};

export default function JourneyMap({
  steps,
  currentStep,
  onStepClick,
  confidenceScore,
  mobileOpen,
  onMobileToggle,
}: Props) {
  return (
    <>
      {/* Sidebar — fixed overlay on mobile, relative column on desktop */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex flex-col w-64 flex-shrink-0',
          'bg-[#0d0f14] border-r border-[rgba(255,255,255,0.07)]',
          'transition-transform duration-200 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:relative lg:z-auto lg:translate-x-0',
        ].join(' ')}
      >
        {/* Step list */}
        <div className="flex-1 overflow-y-auto px-5 pt-8 pb-4">
          <p className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-widest mb-5 px-3">
            Building your Digital Twin
          </p>

          <ol className="space-y-0.5">
            {steps.map(step => (
              <li key={step.number}>
                <button
                  onClick={() => {
                    onStepClick(step.number);
                    if (mobileOpen) onMobileToggle();
                  }}
                  className={[
                    'w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg',
                    'transition-colors text-sm leading-tight',
                    step.state === 'current'
                      ? 'bg-[rgba(64,96,208,0.14)] text-white'
                      : 'hover:bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.52)]',
                  ].join(' ')}
                >
                  <span
                    className={`w-4 flex-shrink-0 font-mono text-xs text-center leading-none ${ICON_COLOR[step.state]}`}
                    aria-label={step.state}
                  >
                    {ICON[step.state]}
                  </span>
                  <span className={step.state === 'current' ? 'font-medium text-white' : ''}>
                    {step.label}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        {/* Confidence footer */}
        <div className="shrink-0 px-5 py-5 border-t border-[rgba(255,255,255,0.06)]">
          <p className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-widest mb-2">
            Current Confidence
          </p>
          <p className="text-2xl font-bold text-white mb-2">{confidenceScore}%</p>
          <div className="h-1 rounded-full bg-[rgba(255,255,255,0.07)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${confidenceScore}%`,
                background:
                  confidenceScore >= 86 ? '#60c080' :
                  confidenceScore >= 61 ? '#5080f0' :
                  confidenceScore >= 31 ? '#4060d0' : '#6080a0',
              }}
            />
          </div>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={onMobileToggle}
          aria-hidden
        />
      )}
    </>
  );
}
