export {}

// ---- gap4e3 tools:

interface ProvenanceArgs { owner?: string; repo?: string; ref?: string }
interface CommitProvenance {
  parents?: Array<{ sha?: string }>
  commit?: { author?: { date?: string | null }; committer?: { date?: string | null }; verification?: { verified?: boolean; reason?: string; verified_at?: string | null } }
  stats?: { additions?: number; deletions?: number; total?: number }
}

