export interface RomSearchResult {
  identifier: string
  title: string
  description?: string
  creator?: string
  date?: string
  format?: string
  size?: number
  mediatype?: string
  collection?: string[]
  downloads?: number
  source: string
  link?: string
}

export interface RomMetadata {
  title: string
  console: string
  region: string
  revision?: string
  serial?: string
  publisher?: string
  developer?: string
  year?: string
  crc32?: string
  md5?: string
  sha1?: string
  size?: number
}

export interface ChecksumMatch {
  game: string
  console: string
  region: string
  revision?: string
  crc32: string
  md5: string
  sha1: string
  size: number
  source: "no-intro" | "redump" | "tosec"
  verified: boolean
}

export interface SaveFileInfo {
  game?: string
  console: string
  format: string
  size: number
  playtime?: number
  lastPlayed?: string
  slot?: number
  valid: boolean
}

export interface CollectionEntry {
  filename: string
  filepath: string
  size: number
  crc32?: string
  md5?: string
  sha1?: string
  matchedGame?: string
  console?: string
  valid: boolean
}
