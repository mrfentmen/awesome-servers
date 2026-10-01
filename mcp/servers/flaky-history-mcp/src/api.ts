export {}

// ---- gap4e3 tools:

interface WorkflowArgs { owner?: string; repo?: string; limit?: number }
interface RunJobsArgs extends WorkflowArgs { run_id?: string }
interface WorkflowRun { id?: number; workflow_id?: number; status?: string; conclusion?: string | null; run_attempt?: number }
interface WorkflowRuns { total_count?: number; workflow_runs?: WorkflowRun[] }
interface RunJob { status?: string; conclusion?: string | null; started_at?: string | null; completed_at?: string | null; steps?: Array<{ conclusion?: string | null }> }

