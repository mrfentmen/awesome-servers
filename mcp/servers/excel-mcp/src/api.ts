export {}

// ---- gap4e3 tools:

interface Rates { amount?: number; base?: string; date?: string; rates?: Record<string, number> }
interface WorldBankRow { date?: string; value?: number | null; country?: { value?: string }; indicator?: { value?: string } }

