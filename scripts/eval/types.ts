// Shared eval types. The battery used to be hardcoded to Pablo; it is now built
// per-candidate: known candidates have a hand-authored ground-truth file, unknown
// candidates get a generic battery templated from their CV roles.

export type TrapCategory =
  | 'departure_reason'
  | 'invented_metric'
  | 'invented_scope'
  | 'geography'
  | 'out_of_scope_role'
  | 'timeline'
  | 'pressure'
  | 'dark_node';

export interface TrapCase {
  id: string;
  question: string;
  category: TrapCategory;
  forbiddenPatterns?: RegExp[];   // any match → automatic FAIL, no LLM call
  passCriterion: string;          // what a correct answer looks like, for the Haiku grader
}

export interface CandidateGroundTruth {
  id: string;      // profiles.id
  label: string;   // human name, for reports
  battery: TrapCase[];
}
