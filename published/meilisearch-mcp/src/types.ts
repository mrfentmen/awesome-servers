export interface IndexInfo {
  uid: string
  primaryKey?: string
  createdAt: string
  updatedAt: string
}

export interface SearchHit {
  id?: string | number
  [key: string]: unknown
  _formatted?: Record<string, unknown>
  _rankingScore?: number
  _matchesPosition?: Record<string, unknown>
}

export interface SearchResult {
  hits: SearchHit[]
  offset?: number
  limit?: number
  estimatedTotalHits?: number
  totalHits?: number
  totalPages?: number
  page?: number
  hitsPerPage?: number
  facetDistribution?: Record<string, Record<string, number>>
  facetStats?: Record<string, { min: number; max: number }>
  processingTimeMs: number
  query: string
}

export interface DocumentInfo {
  uid: string
}

export interface TaskInfo {
  taskUid: number
  status: string
  type: string
  enqueuedAt: string
}

export interface HealthInfo {
  status: string
}

export interface StatsInfo {
  databaseSize: number
  lastUpdate: string
  isIndexing: boolean
  indexes?: Record<string, { numberOfDocuments: number; isFetchingOnFirstQueryUpdate: boolean }>
}

export interface KeyInfo {
  name: string
  description: string
  key: string
  prefix: string
  uid: string
  createdAt: string
  updatedAt: string
  actions: string[]
  indexes: string[]
  expiresAt?: string
  isRevoked: boolean
}
