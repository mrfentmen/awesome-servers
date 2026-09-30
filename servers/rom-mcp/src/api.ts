

// ---- gap2d tools:

// archive.org/metadata/<id> is the one Internet Archive endpoint the server
// already calls but never surfaces: get_download_link picks one ROM out of it
// and discards the rest. This reports the whole manifest, which is what tells
// you whether a set is complete and whether the bytes arrived intact.

interface ArchiveFile {
  name?: string
  size?: string | number | null
  format?: string | null
  md5?: string | null
  sha1?: string | null
  crc32?: string | null
  source?: string | null
}

interface ArchiveItem {
  metadata?: Record<string, string | undefined> | null
  files?: ArchiveFile[] | null
  is_dark?: boolean
  created?: number
}

