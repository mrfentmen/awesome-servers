/**
 * Curated internet-slang lexicon — fully offline, zero network calls.
 * Covers the classic brainrot vocabulary plus the underground rap /
 * SoundCloud scene (Nettspend, Xavier Wulf-era rage, Osamason, etc.)
 * and TikTok-era meme language.
 */

export interface SlangEntry {
  term: string
  meaning: string
  origin: string
  example: string
  vibe: string
}

export const LEXICON: SlangEntry[] = [
  // ---- Core brainrot ----
  {
    term: "skibidi",
    meaning: "Nonsense filler word, popularized by the 'Skibidi Toilet' series. Means basically nothing; used as a sound effect / attention word.",
    origin: "Skibidi Toilet (2023) by DaFuq!Boom!, from a remix of 'Give It To Me' by Timbaland. Absorbed into the brainrot vocabulary wholesale.",
    example: "'skibidi toilet rizz sigma gyatt' — pure nonsense, pure engagement.",
    vibe: "chaos / surreal",
  },
  {
    term: "sigma",
    meaning: "A 'lone wolf' ideal — someone who operates outside the pack. Ironically masculine, often used as a compliment or a joke about edgelord grindset culture.",
    origin: "Sigma male discourse on YouTube/TikTok (2020+), spun off from alpha/beta male memes.",
    example: "'He didn't ask for directions, he just locked in. True sigma.'",
    vibe: "self-improvement / cope",
  },
  {
    term: "rizz",
    meaning: "Charisma / game — the ability to flirt successfully. Shortened from 'charisma.'",
    origin: "Twitch/streamer slang (Kai Cenat, 2021-2022), went mainstream via TikTok.",
    example: "'He pulled her number with zero effort. That's rizz.'",
    vibe: "dating / social game",
  },
  {
    term: "gyatt",
    meaning: "An exclamation for an impressive (usually female) rear end. Often screamed with no other context.",
    origin: "Streamer slang (YourRAGE, 2021) — 'goddamn' slurred and clipped.",
    example: "'GYATT—' (video cuts to a random person walking past).",
    vibe: "horny / loud",
  },
  {
    term: "fanum tax",
    meaning: "Taking a bite of someone's food (or a cut of their earnings) as a 'tax.'",
    origin: "From Fanum, a streamer who routinely eats his friends' food on AMP livestreams (2023).",
    example: "'He asked for a bite and took half. That's the fanum tax.'",
    vibe: "stealing food / funny",
  },
  {
    term: "ohio",
    meaning: "The state as an absurdist punchline — 'Only in Ohio' — representing a place where surreal, cursed things happen.",
    origin: "TikTok memes (2023) about weird Ohio headlines and the 'Ohio vs. the world' edits.",
    example: "'Only in Ohio would the microwave fight back.'",
    vibe: "surreal / cursed",
  },
  {
    term: "mogging",
    meaning: "Visually dominating someone — being noticeably better-looking than them. 'Mog' = overpower.",
    origin: "Looksmaxxing forums / TikTok (2022+). 'To mog someone' is to render them irrelevant by comparison.",
    example: "'He walked in and mogged the whole room.'",
    vibe: "looks hierarchy / insecure",
  },
  {
    term: "looksmaxxing",
    meaning: "The obsessive practice of optimizing your physical appearance (gym, skincare, surgeries, posture).",
    origin: "Incel-adjacent forums → mainstream TikTok self-improvement content (2021+).",
    example: "'Winter arc is all about looksmaxxing — gym, mewing, no junk food.'",
    vibe: "self-optimization / cope",
  },
  {
    term: "mewing",
    meaning: "Resting your tongue on the roof of your mouth to (allegedly) sharpen your jawline.",
    origin: "Named after Dr. Mike Mew (orthodontics), popularized on TikTok as a looksmaxxing practice.",
    example: "'He's been mewing for 3 years and now has a jawline you could cut glass with.'",
    vibe: "looksmaxxing / pseudo-science",
  },
  {
    term: "aura",
    meaning: "Social standing / coolness points, treated like a quantifiable stat that can be gained or lost.",
    origin: "TikTok discourse (2023). 'Aura points' — +100 for a smooth move, -1000 for fumbling.",
    example: "'He caught the dropped glass before it hit the floor. +1000 aura.'",
    vibe: "status / gamification of social life",
  },
  {
    term: "glazing",
    meaning: "Excessively praising someone — 'riding their meat.' Insincere or over-the-top flattery.",
    origin: "Streamer / rap community slang (2023).",
    example: "'Enough glazing, we get it, you like the album.'",
    vibe: "annoyed / calling out bootlicking",
  },
  {
    term: "pmo",
    meaning: "'Piss me off' — used to say something annoys you. Also 'put me on' in context.",
    origin: "Black Twitter / AAVE-derived abbreviation, mainstreamed on TikTok.",
    example: "'The wifi cutting out mid-game pmo fr.'",
    vibe: "annoyance",
  },
  {
    term: "ate",
    meaning: "Performed exceptionally — 'ate and left no crumbs.' Killing it.",
    origin: "Ballroom culture (AAVE) → mainstream internet praise.",
    example: "'That fit ate. No crumbs.'",
    vibe: "praise / iconic",
  },
  {
    term: "mother",
    meaning: "An iconic, nurturing female figure in pop culture — often a diva or pop star. Used with reverence.",
    origin: "Ballroom / gay internet culture; 'Mother' as the head of a house.",
    example: "'Mother said the album drops Friday. We listen.'",
    vibe: "reverence / camp",
  },
  {
    term: "delulu",
    meaning: "Delusional — holding unrealistic beliefs or fantasies, often romantic.",
    origin: "Stan twitter (2020+), shortening of 'delusional.'",
    example: "'He replied to my DM. I'm delulu over him now.'",
    vibe: "self-aware delusion",
  },
  {
    term: "slay",
    meaning: "To do something flawlessly / with style. Broadly: 'excellent.'",
    origin: "Ballroom culture (AAVE) → mainstream (2016+).",
    example: "'She slayed that presentation.'",
    vibe: "praise / excellence",
  },
  {
    term: "bet",
    meaning: "'Okay, deal,' 'I agree' — affirmation.",
    origin: "Black American slang, decades old, absorbed into the mainstream.",
    example: "'We meeting at 9? Bet.'",
    vibe: "agreement",
  },
  {
    term: "no cap",
    meaning: "'No lie / for real' — assertion of truthfulness. 'Cap' = a lie.",
    origin: "Atlanta rap scene (2010s), mainstreamed via TikTok.",
    example: "'No cap, that was the best sandwich I've ever had.'",
    vibe: "honesty / emphasis",
  },
  {
    term: "bussin",
    meaning: "Delicious — 'that food is bussin.' Usually about food, occasionally broader.",
    origin: "AAVE / Philly slang, mainstreamed 2020+.",
    example: "'Bro these fries are bussin.'",
    vibe: "food praise",
  },
  {
    term: "based",
    meaning: "Courageously holding a correct (often contrarian) opinion. Originally a compliment from the Lil B / internet right, now general.",
    origin: "Lil B 'Based God' (2000s) → /pol/ and internet culture.",
    example: "'Unpopular take but he's right. Based.'",
    vibe: "approval of boldness",
  },
  {
    term: "ratio",
    meaning: "Being out-commented (replies > likes, or quote-replies dominating) — a loss condition on social media.",
    origin: "Twitter/X (2018+).",
    example: "'Bro got ratio'd into oblivion and deleted the tweet.'",
    vibe: "L / clout loss",
  },
  {
    term: "brainrot",
    meaning: "The state of your brain after consuming too much low-quality internet content; also a genre of content itself.",
    origin: "Online communities describing TikTok-brain (2023).",
    example: "'I've watched 200 skibidi edits. The brainrot is terminal.'",
    vibe: "self-deprecation / chronic online",
  },
  {
    term: "sus",
    meaning: "Suspicious. From Among Us (2020).",
    origin: "'Suspicious' → Among Us gameplay callouts.",
    example: "'Why is he staring at the wall? Kinda sus.'",
    vibe: "suspicion / meme",
  },
  {
    term: "fr fr",
    meaning: "'For real, for real' — serious emphasis.",
    origin: "AAVE, TikTok era.",
    example: "'I'm not playing, fr fr.'",
    vibe: "sincerity",
  },
  {
    term: "deadass",
    meaning: "Seriously / no joke — New York slang for 'for real.'",
    origin: "NYC (2010s), mainstreamed via rap and TikTok.",
    example: "'Deadass thought I lost my wallet.'",
    vibe: "NYC / sincerity",
  },
  {
    term: "NPC",
    meaning: "A person who reacts on autopilot with no independent thought — a background character in your life.",
    origin: "Gaming term → 2018+ internet insult for mindless people.",
    example: "'He just repeats whatever the news says. Total NPC.'",
    vibe: "insult / dehumanizing",
  },
  {
    term: "goblin mode",
    meaning: "Unapologetically sloppy, chaotic, or anti-social behavior — not caring how you look.",
    origin: "Twitter meme (2022), Oxford Word of the Year 2022.",
    example: "'I'm in goblin mode — haven't showered, eating cereal over the sink.'",
    vibe: "chaos / burnout",
  },
  {
    term: "coomer",
    meaning: "A chronically horny internet dweller, usually spending hours consuming adult content. Degenerate-ish.",
    origin: "4chan / Reddit (2019+).",
    example: "'He posted a thirst trap and every coomer in the replies reacted.'",
    vibe: "degenerate / self-aware",
  },
  {
    term: "degen",
    meaning: "Degenerate — gambling, doomscrolling, or generally reckless online behavior, embraced ironically.",
    origin: "Gambling/trading communities → general internet.",
    example: "'I put my rent on a random coin. I'm a degen, what can I say.'",
    vibe: "reckless / gambling",
  },
  {
    term: "rent free",
    meaning: "Living in someone's head without paying — being constantly on someone's mind.",
    origin: "Sports trash talk / Twitter.",
    example: "'He's been talking about me for weeks. I live rent free in his head.'",
    vibe: "living in heads",
  },
  {
    term: "touch grass",
    meaning: "'Go outside' — a rebuke for being too online.",
    origin: "Gamer/internet communities (2020+).",
    example: "'You've been arguing in the replies for 6 hours. Touch grass.'",
    vibe: "rebuke / offline reminder",
  },
  {
    term: "rizzler",
    meaning: "A person with charisma — a 'master rizz.'",
    origin: "Derived from rizz (2022+).",
    example: "'Bro's a certified rizzler, pulls every time.'",
    vibe: "dating / flexing",
  },
  {
    term: "grimace shake",
    meaning: "A shake sold by McDonald's to promote Grimace; spawned surreal viral videos (2023).",
    origin: "McDonald's Grimace Birthday Meal (June 2023).",
    example: "'The grimace shake videos are either horror or pure euphoria, no in-between.'",
    vibe: "fast food / surrealism",
  },
  {
    term: "baby gronk",
    meaning: "A hyper-confident kid athlete who went viral in edits; shorthand for 'random famous kid who posts glow-up content.'",
    origin: "TikTok (2024), from NFL player Rob Gronkowski's name + edits.",
    example: "'Baby gronk rizzed up livvy dunne before the LSU game.'",
    vibe: "child star / edits",
  },
  {
    term: "hawk tuah",
    meaning: "A viral soundbite about a sex act; became an instant meme (2024). Use is ironic.",
    origin: "Tim & Dee TV street interview (June 2024).",
    example: "'She said it with her whole chest. HAWK TUAH.'",
    vibe: "viral / cursed",
  },
  {
    term: "cuh",
    meaning: "'Cousin' — term of address between friends. NYC drill slang.",
    origin: "NYC drill rap (Sha EK, 2021+).",
    example: "'Yo cuh, pass the aux.'",
    vibe: "NYC drill / brotherhood",
  },
  {
    term: "pookie",
    meaning: "A sweet nickname for someone you love; also used ironically for wild animals or inanimate objects.",
    origin: "TikTok (2023+).",
    example: "'Pookie's back from work. Time to lock in.'",
    vibe: "affection / cute",
  },
  {
    term: "blud",
    meaning: "'Blood' — British (esp. London) term of address, exported to the internet.",
    origin: "UK roadman slang → TikTok.",
    example: "'Blud thinks he's him.'",
    vibe: "UK / calling someone delusional",
  },
  {
    term: "bop",
    meaning: "A great song; also 'bop' = to bounce/dance. Or the verb for hitting someone playfully.",
    origin: "Hip-hop slang, decades old; mainstreamed on TikTok.",
    example: "'This new Nettspend track is a bop.'",
    vibe: "music praise",
  },
  {
    term: "snack",
    meaning: "An attractive person ('you a whole snack').",
    origin: "Internet slang (2010s).",
    example: "'He pulled up looking like a snack.'",
    vibe: "attraction",
  },
  {
    term: "era",
    meaning: "A phase of someone's life, framed as an album era ('villain era,' 'glow-up era').",
    origin: "Stan culture / TikTok (2020+).",
    example: "'We're in our gym rat era now.'",
    vibe: "self-narration",
  },
  {
    term: "serve",
    meaning: "To look amazing / deliver a look ('serving face, serving looks').",
    origin: "Ballroom culture (AAVE) → mainstream.",
    example: "'She's serving cunt in that fit.'",
    vibe: "praise / fashion",
  },
  {
    term: "cooked",
    meaning: "Done for / doomed — 'we're cooked.' Or, in gaming, 'he cooked' = he performed well.",
    origin: "Gaming / TikTok (2023+).",
    example: "'Final boss at 1 HP and no heals. We're cooked.'",
    vibe: "doomed / resigned",
  },
  {
    term: "yapping",
    meaning: "Talking too much, especially about nothing.",
    origin: "Gaming / TikTok (2022+).",
    example: "'Stop yapping and drop the item.'",
    vibe: "annoyance / talkative",
  },
  {
    term: "tweaking",
    meaning: "Acting erratically / overreacting. Or, in drug context, stimulant behavior.",
    origin: "AAVE → TikTok.",
    example: "'He's tweaking over a video game.'",
    vibe: "overreacting",
  },
  {
    term: "gooning",
    meaning: "Losing yourself in a brain-meltingly repetitive activity (originally... well, you know). Used ironically for any obsessive grind.",
    origin: "4chan-adjacent slang (2019+), co-opted as a meme.",
    example: "'Been gooning on this grindset edit for hours.'",
    vibe: "degenerate / ironic",
  },
  {
    term: "deranged",
    meaning: "Wildly unhinged — said approvingly of chaotic content.",
    origin: "TikTok comment culture (2023+).",
    example: "'This edit is absolutely deranged, I love it.'",
    vibe: "chaos appreciation",
  },
  {
    term: "chronically online",
    meaning: "So deep in internet culture you've lost touch with reality.",
    origin: "Twitter discourse (2020+).",
    example: "'Bro's chronically online, he thinks everyone knows what skibidi means.'",
    vibe: "self-aware / roast",
  },
  {
    term: "doomscrolling",
    meaning: "Endlessly scrolling bad news. The classic behavior of the internet era.",
    origin: "2018+ (popularized during 2020).",
    example: "'I was doomscrolling at 3am and now I know the entire supply chain crisis.'",
    vibe: "depressing / relatable",
  },
  {
    term: "main character",
    meaning: "Treating yourself as the protagonist of life — 'main character energy.'",
    origin: "TikTok (2020+).",
    example: "'Walking into the cafe like the main character.'",
    vibe: "self-centered / cinematic",
  },
  {
    term: "mid",
    meaning: "Mediocre — the ultimate dismissal.",
    origin: "Hip-hop / gaming discourse (2019+).",
    example: "'The album was mid. Overhyped.'",
    vibe: "disappointment",
  },
  {
    term: "locked in",
    meaning: "Fully focused / committed to a goal.",
    origin: "Sports/gym TikTok (2023+).",
    example: "'Winter arc. Locked in. No excuses.'",
    vibe: "motivation / grind",
  },
  {
    term: "W / L",
    meaning: "'Win' / 'Loss' — shorthand verdict on any outcome.",
    origin: "Gaming communities (2010s).",
    example: "'Got the last pair in my size. Massive W.'",
    vibe: "verdict / scorekeeping",
  },
  // ---- Underground rap / SoundCloud scene ----
  {
    term: "nettspend",
    meaning: "Young underground rapper (real name Gunner Shepard) whose chaotic meme-rap made him the face of the 2024 underground wave. Associated with 'sx' and absurdist lyrics.",
    origin: "SoundCloud underground scene, went viral via TikTok edits (2023-2024).",
    example: "'Nettspend's whole deal is saying nonsense over rage beats and it somehow works.'",
    vibe: "underground rap / brainrot-adjacent",
  },
  {
    term: "xaviersobased",
    meaning: "Underground rapper known for dreamy, sample-heavy, 'cloud' style production and ironic aesthetics. Pioneer of the current wave.",
    origin: "SoundCloud underground (2020+), NYC-adjacent scene.",
    example: "'Xaviersobased makes music that sounds like a distorted memory.'",
    vibe: "underground rap / dreamlike",
  },
  {
    term: "osamason",
    meaning: "Underground rapper (Austin, TX) in the Opium-adjacent rage wave; known for aggressive, distorted beats.",
    origin: "SoundCloud (2021+), part of the 'rage' movement.",
    example: "'Osamason's beats hit like a brick through a window.'",
    vibe: "rage / aggressive",
  },
  {
    term: "kankan",
    meaning: "Underground rapper (Houston) known for syrupy, hypnotic melodies; key figure in the current underground sound.",
    origin: "SoundCloud (2020+).",
    example: "'KanKan's whole wave is the sound of a hot summer night.'",
    vibe: "underground rap / hypnotic",
  },
  {
    term: "lazerdim700",
    meaning: "Underground rapper from the current SoundCloud wave; part of the new generation pushing the 'plugg/rage' hybrid sound.",
    origin: "SoundCloud underground (2022+).",
    example: "'Lazerdim700 is one of those names you catch before the algorithm does.'",
    vibe: "underground rap / plugg",
  },
  {
    term: "plugg",
    meaning: "A subgenre of trap defined by spacey, minimal, synth-heavy beats — sounds like floating. Originated with producer Zaytoven-adjacent Atlanta circles, perfected by the 'plugg' collective (2015+).",
    origin: "Atlanta plugg scene (2015+), kept alive by the underground in the 2020s.",
    example: "'That plugg beat could cure my anxiety.'",
    vibe: "music genre / ethereal",
  },
  {
    term: "rage",
    meaning: "An aggressive, distortion-heavy subgenre of trap rap (the Playboi Carti / Ken Carson / Destroy Lonely sound), built for mosh pits.",
    origin: "2019-2021 rage movement, Opium label aesthetic.",
    example: "'Rage beats are just 150 BPM chaos and I'm here for it.'",
    vibe: "music genre / mosh",
  },
  {
    term: "soundcloud rap",
    meaning: "The 2016+ generation of rappers who blew up through SoundCloud rather than labels — from Lil Uzi Vert and X to the current underground.",
    origin: "SoundCloud platform era (2015+).",
    example: "'SoundCloud rap went from bedroom uploads to selling out arenas.'",
    vibe: "music history / DIY",
  },
  {
    term: "opium",
    meaning: "Playboi Carti's record label / aesthetic collective (Ken Carson, Destroy Lonely). Defined the rage-wave look: gothic, vampiric, avant-garde.",
    origin: "Opium label (2019+).",
    example: "'The Opium sound is either screaming over distorted bass or hypnotic silence.'",
    vibe: "label / aesthetic",
  },
  {
    term: "destroy lonely",
    meaning: "Underground rapper on Opium, known for atmospheric auto-tuned anthems. A key voice of the rage wave.",
    origin: "Opium (2021+).",
    example: "'Destroy Lonely's vocals float over rage beats like a ghost.'",
    vibe: "underground rap / atmospheric",
  },
  {
    term: "ken carson",
    meaning: "Opium artist whose aggressive, high-pitched delivery on distorted beats defines the current rage sound.",
    origin: "Opium (2021+).",
    example: "'Ken Carson's voice is a weapon.'",
    vibe: "rage / aggressive",
  },
  // ---- Misc classics ----
  {
    term: "based god",
    meaning: "Lil B's self-title; the origin of 'based' as a positive term for doing your own thing.",
    origin: "Lil B (2000s) — the internet's favorite mystic rapper.",
    example: "'Thank you based god.'",
    vibe: "meme / gratitude",
  },
  {
    term: "gaslight gatekeep girlboss",
    meaning: "A satirical feminist motto — mocking the toxic 'girlboss' archetype while celebrating audacity.",
    origin: "Tumblr (2019).",
    example: "'She gaslit, gatekept, girlbossed her way to the top.'",
    vibe: "satire / empowerment",
  },
  {
    term: "ok boomer",
    meaning: "Dismissing outdated Baby Boomer takes. A generational shutdown.",
    origin: "TikTok (2019), Word of the Year 2019.",
    example: "''Reusable bags are woke' — ok boomer.'",
    vibe: "generational war",
  },
  {
    term: "do it for the vine",
    meaning: "Old-school internet: doing something risky/stupid for a 6-second Vine video.",
    origin: "Vine (2013-2017).",
    example: "'Bro climbed the water tower for the vine.'",
    vibe: "nostalgia / recklessness",
  },
]

export function lookupExact(term: string): SlangEntry | undefined {
  const q = term.toLowerCase().trim()
  return LEXICON.find(
    (e) =>
      e.term.toLowerCase() === q ||
      e.term.toLowerCase().replace(/\s+/g, "") === q.replace(/\s+/g, "")
  )
}

export function searchLexicon(query: string): SlangEntry[] {
  const q = query.toLowerCase()
  return LEXICON.filter(
    (e) =>
      e.term.toLowerCase().includes(q) ||
      e.meaning.toLowerCase().includes(q) ||
      e.vibe.toLowerCase().includes(q)
  )
}

/** Find every known term present in a blob of text. */
export function findInText(text: string): SlangEntry[] {
  const found: SlangEntry[] = []
  for (const e of LEXICON) {
    const term = e.term.toLowerCase()
    // Require word-ish boundaries so 'cap' doesn't match inside
    // 'capacity' and 'rizz' doesn't match inside 'rizzlable'.
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const re = new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i")
    if (re.test(text)) found.push(e)
  }
  return found
}
