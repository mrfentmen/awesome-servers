const BASE = 'https://graphql.anilist.co';
const UA = 'mrfentmen-anilist-mcp/1.0 (https://github.com/mrfentmen)';
export class AnilistError extends Error {
}
async function query(ql, variables) {
    const res = await fetch(BASE, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query: ql, variables }),
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new AnilistError(`AniList returned ${res.status}`);
    const d = (await res.json());
    if (d.errors?.length)
        throw new AnilistError(d.errors[0].message ?? 'AniList error');
    if (!d.data)
        throw new AnilistError('AniList returned no data');
    return d.data;
}
const SEARCH_QL = `
query($search: String, $type: MediaType, $perPage: Int) {
  Page(page: 1, perPage: $perPage) {
    media(search: $search, type: $type) {
      id
      title { romaji english }
      format
      episodes
      chapters
      averageScore
      status
      seasonYear
      genres
      description(asHtml: false)
      siteUrl
    }
  }
}`;
function fmt(m) {
    const t = m.title?.english ?? m.title?.romaji ?? '?';
    return [
        `${t} (${m.format ?? '?'}${m.seasonYear ? `, ${m.seasonYear}` : ''})`,
        m.episodes ? `Episodes: ${m.episodes}` : m.chapters ? `Chapters: ${m.chapters}` : '',
        `Score: ${m.averageScore ?? '?'} | Status: ${m.status ?? '?'}`,
        m.genres?.length ? `Genres: ${m.genres.join(', ')}` : '',
        (m.description ?? '').replace(/<[^>]*>/g, '').slice(0, 200),
        m.siteUrl ?? '',
    ].filter(Boolean).join('\n');
}
export async function searchAnime(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        throw new AnilistError('Provide a search query');
    const limit = Math.max(1, Math.min(args.limit ?? 5, 15));
    const d = await query(SEARCH_QL, { search: q, type: 'ANIME', perPage: limit });
    const list = d.Page.media;
    if (!list.length)
        return `No anime found for "${q}".`;
    return `AniList anime for "${q}":\n` + list.map((m) => fmt(m)).join('\n\n');
}
export async function searchManga(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        throw new AnilistError('Provide a search query');
    const limit = Math.max(1, Math.min(args.limit ?? 5, 15));
    const d = await query(SEARCH_QL, { search: q, type: 'MANGA', perPage: limit });
    const list = d.Page.media;
    if (!list.length)
        return `No manga found for "${q}".`;
    return `AniList manga for "${q}":\n` + list.map((m) => fmt(m)).join('\n\n');
}
const DETAIL_QL = `
query($id: Int) {
  Media(id: $id) {
    id
    title { romaji english }
    format
    episodes
    chapters
    averageScore
    popularity
    status
    seasonYear
    genres
    studios { nodes { name } }
    description(asHtml: false)
    siteUrl
  }
}`;
function fmtDetail(m) {
    const t = m.title?.english ?? m.title?.romaji ?? '?';
    return [
        `${t} (${m.format ?? '?'}${m.seasonYear ? `, ${m.seasonYear}` : ''})`,
        m.episodes ? `Episodes: ${m.episodes}` : m.chapters ? `Chapters: ${m.chapters}` : '',
        `Score: ${m.averageScore ?? '?'} | Popularity: ${m.popularity ?? '?'} | Status: ${m.status ?? '?'}`,
        m.genres?.length ? `Genres: ${m.genres.join(', ')}` : '',
        m.studios?.nodes?.length ? `Studios: ${m.studios.nodes.map((s) => s.name).filter(Boolean).join(', ')}` : '',
        (m.description ?? '').replace(/<[^>]*>/g, '').slice(0, 300),
        m.siteUrl ?? '',
    ].filter(Boolean).join('\n');
}
export async function mediaDetails(args) {
    const id = Number(args.id);
    if (!Number.isInteger(id) || id <= 0)
        throw new AnilistError('Provide a positive AniList media ID');
    const d = await query(DETAIL_QL, { id });
    if (!d.Media)
        throw new AnilistError(`No media with id ${id}.`);
    return fmtDetail(d.Media);
}
const SEASON_QL = `
query($season: MediaSeason, $year: Int, $perPage: Int) {
  Page(page: 1, perPage: $perPage) {
    media(season: $season, seasonYear: $year, sort: POPULARITY_DESC) {
      id
      title { romaji english }
      format
      averageScore
      genres
    }
  }
}`;
export async function seasonBrowse(args) {
    const season = (args.season ?? '').trim().toUpperCase();
    if (!['WINTER', 'SPRING', 'SUMMER', 'FALL'].includes(season))
        throw new AnilistError('Season must be WINTER, SPRING, SUMMER or FALL.');
    const year = Number(args.year) || new Date().getFullYear();
    const limit = Math.max(1, Math.min(args.limit ?? 10, 20));
    const d = await query(SEASON_QL, { season, year, perPage: limit });
    const list = d.Page.media;
    if (!list.length)
        return `Nothing found for ${season} ${year}.`;
    return `Season ${season} ${year}:\n` + list.map((m) => fmt(m)).join('\n\n');
}
const CHAR_QL = `
query($id: Int) {
  Character(id: $id) {
    id
    name { full native }
    image { large }
    description(asHtml: false)
    siteUrl
    media(perPage: 5) { nodes { title { romaji } } }
  }
}`;
export async function characterDetails(args) {
    const id = Number(args.id);
    if (!Number.isInteger(id) || id <= 0)
        throw new AnilistError('Provide a positive character ID');
    const d = await query(CHAR_QL, { id });
    const c = d.Character;
    if (!c)
        throw new AnilistError(`No character with id ${id}.`);
    return [
        `${c.name?.full ?? '?'}${c.name?.native ? ` (${c.name.native})` : ''}`,
        (c.description ?? '').replace(/<[^>]*>/g, '').slice(0, 300),
        c.media?.nodes?.length ? `Appears in: ${c.media.nodes.map((m) => m.title?.romaji).filter(Boolean).join(', ')}` : '',
        c.siteUrl ?? '',
    ].filter(Boolean).join('\n');
}
const STUDIO_QL = `
query($id: Int) {
  Studio(id: $id) {
    id
    name
    isAnimationStudio
    siteUrl
    media(perPage: 5, sort: POPULARITY_DESC) { nodes { title { romaji } } }
  }
}`;
export async function studioDetails(args) {
    const id = Number(args.id);
    if (!Number.isInteger(id) || id <= 0)
        throw new AnilistError('Provide a positive studio ID');
    const d = await query(STUDIO_QL, { id });
    const s = d.Studio;
    if (!s)
        throw new AnilistError(`No studio with id ${id}.`);
    return [
        `${s.name ?? '?'}${s.isAnimationStudio ? ' (animation studio)' : ''}`,
        s.media?.nodes?.length ? `Known for: ${s.media.nodes.map((m) => m.title?.romaji).filter(Boolean).join(', ')}` : '',
        s.siteUrl ?? '',
    ].filter(Boolean).join('\n');
}
const STAFF_QL = `
query($id: Int) {
  Staff(id: $id) {
    id
    name { full native }
    languageV2
    description(asHtml: false)
    siteUrl
  }
}`;
export async function staffDetails(args) {
    const id = Number(args.id);
    if (!Number.isInteger(id) || id <= 0)
        throw new AnilistError('Provide a positive staff ID');
    const d = await query(STAFF_QL, { id });
    const s = d.Staff;
    if (!s)
        throw new AnilistError(`No staff with id ${id}.`);
    return [
        `${s.name?.full ?? '?'}${s.name?.native ? ` (${s.name.native})` : ''}`,
        s.languageV2 ? `Language: ${s.languageV2}` : '',
        (s.description ?? '').replace(/<[^>]*>/g, '').slice(0, 300),
        s.siteUrl ?? '',
    ].filter(Boolean).join('\n');
}
const USERLIST_QL = `
query($user: String, $type: MediaType) {
  MediaListCollection(userName: $user, type: $type) {
    lists { name entries { score status media { title { romaji } } } }
  }
}`;
export async function userList(args) {
    const user = (args.username ?? '').trim();
    if (!user)
        throw new AnilistError('Provide an AniList username');
    const type = (args.type ?? 'ANIME').trim().toUpperCase() === 'MANGA' ? 'MANGA' : 'ANIME';
    const d = await query(USERLIST_QL, { user, type });
    const lists = d.MediaListCollection?.lists ?? [];
    if (!lists.length)
        return `No public ${type.toLowerCase()} lists for ${user}.`;
    return lists.slice(0, 4).map((l) => `${l.name ?? 'List'}:\n` + (l.entries ?? []).slice(0, 8).map((e) => `- ${e.media?.title?.romaji ?? '?'} [${e.status ?? '?'}] score ${e.score ?? 0}`).join('\n')).join('\n\n');
}
