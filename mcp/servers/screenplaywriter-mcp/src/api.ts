

// ---- gap2d tools:

// The other twelve tools on this server never leave the machine: they parse,
// edit and write Fountain. This one is the exception, because source research is
// something a writer doing adaptation genuinely needs and cannot do from a local
// parse. Open Library's API is public, keyless and needs no account.

interface OlSearchDoc {
  key?: string
  title?: string
  subtitle?: string
  author_name?: string[]
  first_publish_year?: number
  edition_count?: number
  language?: string[]
  ia?: string[]
  subject?: string[]
}

interface OlWork {
  title?: string
  subtitle?: string
  first_publish_date?: string
  description?: string | { value?: string; type?: string } | null
  subjects?: string[]
  subject_people?: string[]
  subject_places?: string[]
  subject_times?: string[]
}

