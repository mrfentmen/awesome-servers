export {}

// ---- gap4e3 tools:

interface PublicRepoArgs { owner?: string; repo?: string }
interface PublicCompareArgs extends PublicRepoArgs { base?: string; head?: string }
interface PublicChecksArgs extends PublicRepoArgs { ref?: string; limit?: number }

