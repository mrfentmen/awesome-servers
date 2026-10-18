// Site starter templates, extracted from the ScriptWriter website
// (public/app.js `scriptTemplates`). Re-run gen after the site changes them.
// The agent writes INTO these skeletons; the user opens the result on the site.

export interface SiteTemplate {
  key: string
  title: string
  desc: string
  format?: string
  content: string
}

export const SITE_TEMPLATES: SiteTemplate[] = [
  {
    "key": "blank",
    "title": "Untitled Script",
    "desc": "A completely empty page. Start from scratch.",
    "content": ""
  },
  {
    "key": "feature",
    "title": "Feature Film",
    "desc": "A full 3-act feature: inciting incident, midpoint, climax. For stories 90–120 pages.",
    "content": "FADE IN:\n\nINT. LOCATION - DAY\n\n[Describe the world. Who is here? What are they doing?]\n\nPROTAGONIST\n[First line of dialogue goes here.]\n\n[Something happens that changes everything. This is the inciting incident.]\n\nINT. LOCATION - NIGHT\n\n[The protagonist tries to solve the problem. It does not go well.]\n\n[Midpoint: a big reveal or reversal that raises the stakes.]\n\nEXT. LOCATION - DAY\n\n[The darkest moment. It looks like the protagonist will fail.]\n\n[Climax: the protagonist faces the central conflict one last time.]\n\n[Resolution: how has the world changed?]\n\nFADE OUT."
  },
  {
    "key": "tv",
    "title": "TV Pilot",
    "desc": "A one-hour series episode: cold open, three acts, a season hook.",
    "content": "FADE IN:\n\nCOLD OPEN\n\nINT. LOCATION - DAY\n\n[One scene that hooks the viewer before the title.]\n\nTITLE CARD\n\nACT ONE\n\nINT. LOCATION - NIGHT\n\n[Meet the protagonist in their ordinary world.]\n\n[The problem of the episode arrives. What do they want this week?]\n\nACT TWO\n\n[Complications. The plan makes things worse.]\n\n[Midpoint twist that changes the goal.]\n\nACT THREE\n\n[The confrontation. The protagonist acts on what they learned.]\n\n[Tag: a hint of the longer season arc.]\n\nFADE OUT."
  },
  {
    "key": "short",
    "title": "Short Film",
    "desc": "One idea, one character, 1–15 pages. A moment, a problem, a payoff.",
    "content": "FADE IN:\n\nINT. LOCATION - DAY\n\n[A moment. One image or action that tells us who this person is.]\n\nCHARACTER\n[One line of dialogue.]\n\n[Something small goes wrong.]\n\n[The character makes a choice. It costs them something.]\n\n[The payoff — the story's single idea lands.]\n\nFADE OUT."
  },
  {
    "key": "stage",
    "title": "Stage Play",
    "desc": "Theater format: acts and scenes, stage directions, curtain.",
    "content": "ACT I\n\nSCENE 1\n\n[A simple room. The sound of rain.]\n\nPROTAGONIST\n[First line.]\n\nSECOND CHARACTER\n[Reply.]\n\n(They look at each other. Neither speaks.)\n\n[The conflict of the play is introduced.]\n\nACT II\n\nSCENE 1\n\n[Complications multiply.]\n\nACT III\n\nSCENE 1\n\n[The confrontation and its aftermath.]\n\nCURTAIN."
  },
  {
    "key": "youtube",
    "title": "YouTube Script",
    "desc": "Video structure: hook, intro, three main points, outro.",
    "content": "[HOOK - first 15 seconds]\n[One sentence that makes someone stop scrolling.]\n\n[INTRO]\n[Who you are and what this video is about, in 30 seconds.]\n\n[MAIN POINT 1]\n[Say it. Show it. Example.]\n\n[MAIN POINT 2]\n[Say it. Show it. Example.]\n\n[MAIN POINT 3]\n[Say it. Show it. Example.]\n\n[OUTRO]\n[Recap the takeaway. Tell them what to watch next.]"
  },
  {
    "key": "horror",
    "title": "Horror",
    "desc": "Feature-length horror: dread, escalating wrongness, a threat that never fully ends.",
    "content": "FADE IN:\n\nINT. HOUSE - NIGHT\n\n[A quiet domestic scene. Everything is normal. Too normal.]\n\n[The first wrong thing. Small. Deniable. Easy to talk yourself out of.]\n\nPROTAGONIST\n[They notice something is off.]\n\n[They dismiss it. The audience does not.]\n\nINT. HOUSE - LATER\n\n[The wrong thing happens again, bigger. The rules of the threat start to emerge.]\n\n[The protagonist investigates. The wrong thing is gone - or worse, someone else has seen it too.]\n\nEXT. STREET - NIGHT\n\n[What does the threat want? The protagonist forms a plan.]\n\n[The darkest hour: alone, cornered, outmatched.]\n\n[The final confrontation. The protagonist must sacrifice something to end it.]\n\n[Resolution - with a sting. The threat is not truly gone.]\n\nFADE OUT."
  },
  {
    "key": "comedy",
    "title": "Comedy",
    "desc": "Feature comedy: a flawed protagonist, a lie they tell themselves, and a public disaster.",
    "content": "FADE IN:\n\nINT. OFFICE - DAY\n\n[A protagonist in their ordinary, slightly ridiculous world.]\n\nPROTAGONIST\n[Comedy comes from character - their flaw, their blind spot.]\n\n[The goal: the thing they want most is the thing they keep sabotaging.]\n\n[Complication. Every fix makes it funnier and worse.]\n\n[The lie they tell themselves. The audience sees straight through it.]\n\n[The public disaster: their plan blows up in the most embarrassing way possible.]\n\n[The realization. They finally see the truth about themselves.]\n\n[The awkward, heartfelt fix - funny, but genuine.]\n\n[The new normal. Same world, slightly wiser protagonist.]\n\nFADE OUT."
  },
  {
    "key": "documentary",
    "title": "Documentary",
    "desc": "Non-fiction structure: question, world, interviews, turn, stakes, resolution.",
    "content": "FADE IN:\n\n[OPENING IMAGE]\n[One image that contains the whole subject - a face, a place, an object.]\n\n[THE QUESTION]\n[What is this film about, in one sentence? Show it visually, do not narrate it.]\n\n[THE WORLD]\n[Where and who. Establish the subject through observation, not explanation.]\n\n[INTERVIEW]\nSUBJECT NAME\n[What they say must move the story forward.]\n\n[THE CONFLICT]\n[The problem, obstacle, or tension at the heart of the subject.]\n\n[THE TURN]\n[A revelation or reversal. The situation changes.]\n\n[THE STAKES]\n[Why this matters now. What is lost if nothing changes.]\n\n[INTERVIEW]\nSUBJECT NAME\n[The subject reckons with the stakes.]\n\n[THE RESOLUTION]\n[Where the subject lands - changed, unresolved, or defiant.]\n\n[END CARD]\n[One final thought. The films closing image.]\n\nFADE OUT."
  },
  {
    "key": "musicvideo",
    "title": "Music Video",
    "desc": "Visual structure for a song: hook, verses, chorus, bridge, final payoff.",
    "content": "FADE IN:\n\n[HOOK - first 5 seconds]\n[One bold image that stops the scroll. No story yet - pure image.]\n\n[VERSE 1]\n[Performance: the artist in a striking location. Camera holds, then moves.]\n\n[The image shifts - a second world, the narrative side of the video.]\n\n[CHORUS]\n[The visual payoff. The two worlds collide or the energy peaks.]\n\n[VERSE 2]\n[Repeat and escalate. New location, more movement.]\n\n[CHORUS]\n[Bigger. The hook image returns, transformed.]\n\n[BRIDGE]\n[The quiet moment. One face, one gesture, one surreal image.]\n\n[FINAL CHORUS]\n[Everything at once. Performance and story converge.]\n\n[OUTRO]\n[The last image. Hold it, then cut to black.]\n\nFADE OUT."
  },
  {
    "key": "thriller",
    "title": "Thriller",
    "desc": "A protagonist caught in escalating danger: wrong detail, threat, betrayal, confrontation.",
    "content": "FADE IN:\n\nINT. APARTMENT - NIGHT\n\n[The protagonist in their ordinary life. A small detail is wrong.]\n\n[They dismiss it. It comes back, bigger.]\n\n[The threat makes itself known. The protagonist has something someone wants.]\n\n[They go to the authorities - who cannot or will not help.]\n\n[The protagonist runs. Every safe place becomes unsafe.]\n\n[The betrayal. The person they trusted is connected to the threat.]\n\n[The confrontation. The protagonist uses what they know against the threat.]\n\n[Resolution. The threat ends - but the cost is visible.]\n\nFADE OUT."
  },
  {
    "key": "romcom",
    "title": "Rom-Com",
    "desc": "Meet-cute, obstacle, almost-kiss, misunderstanding, grand gesture, kiss.",
    "content": "FADE IN:\n\nINT. COFFEE SHOP - DAY\n\n[Meet the two leads. They are opposites in one specific, comic way.]\n\n[MEET-CUTE]\n[They collide in the worst possible first impression. Funny, not mean.]\n\n[The obstacle: one of them is unavailable, moving away, or lying to themselves.]\n\n[The dates. Each scene brings them closer while the obstacle looms.]\n\n[The almost-kiss. Something interrupts at the exact wrong moment.]\n\n[THE FIGHT]\n[The misunderstanding. The obstacle wins. They separate.]\n\n[THE GRAND GESTURE]\n[One of them does the embarrassing, heartfelt thing in public.]\n\n[The kiss. The obstacle is gone.]\n\n[The new normal. Two people who finally see each other.]\n\nFADE OUT."
  },
  {
    "key": "webseries",
    "title": "Web Series",
    "desc": "A short-form episode: cold open, one tight story, a hook for the next episode.",
    "content": "FADE IN:\n\nCOLD OPEN\n\nINT. LOCATION - DAY\n\n[One quick joke or moment that hooks viewers in the first 10 seconds.]\n\nTITLE CARD\n\nACT ONE\n\nINT. LOCATION - DAY\n\n[Set up this episode's small problem fast. Web episodes have no time to waste.]\n\nCHARACTER A\n[Establish their voice in one line.]\n\nCHARACTER B\n[And theirs - contrast is comedy.]\n\nACT TWO\n\n[The problem gets worse. Keep every scene shorter than a minute of screen time.]\n\nCLIFFHANGER\n\n[End on a question, a reveal, or a laugh - something that makes clicking the next episode automatic.]\n\nFADE OUT."
  },
  {
    "key": "audiodrama",
    "title": "Audio Drama",
    "desc": "A podcast/radio play: sound cues, narrator, dialogue that carries everything.",
    "content": "FADE IN:\n\n[SOUND: rain on a window. Distant thunder.]\n\nNARRATOR (V.O.)\n[Open with one line that sets the scene. The listener sees nothing - you paint it all.]\n\n[SOUND: a door opens. Footsteps on wood.]\n\nCHARACTER\n[Dialogue must carry names and action, since there are no visuals. Have characters address each other naturally.]\n\nSECOND CHARACTER\n(whispering)\n[Parentheticals do double duty here: they are vocal direction for the actor.]\n\n[SOUND: glass shatters. A scream - cut short.]\n\n[MUSIC: sting.]\n\nNARRATOR (V.O.)\n[Act break or cliffhanger line.]\n\nFADE OUT."
  },
  {
    "key": "sketch",
    "title": "Sketch Comedy",
    "desc": "One 2-4 page comedy sketch: a single absurd premise pushed to its limit.",
    "content": "FADE IN:\n\nINT. LOCATION - DAY\n\n[State the absurd premise immediately. A sketch is one joke told at increasing intensity.]\n\nCHARACTER A\n[Play it straight. The funniest person in the room is the one who does not know they are in a sketch.]\n\nCHARACTER B\n[Escalate. Rule one of sketch: the second beat is bigger than the first.]\n\n[Beat three: even bigger. New character, new consequence, same logic.]\n\n[Turn the premise on itself - the twist or reversal.]\n\n[BUTTON]\n[Land the final punchline and get out. End on the biggest laugh, never explain the joke.]\n\nFADE OUT."
  },
  {
    "key": "videogame",
    "title": "Video Game Cinematic",
    "desc": "Cutscene/cinematic format: camera direction, VO lines, gameplay hand-off points.",
    "content": "FADE IN:\n\nINT. LOCATION - CINEMATIC\n\n[CAMERA: slow push through a destroyed corridor. Describe only what the player sees.]\n\nCHARACTER (V.O.)\n[Voice-over over establishing shots. Games favor short, weighted lines.]\n\n[CAMERA: on the protagonist's face. A choice hangs in the air.]\n\nALLY CHARACTER\n[Deliver the mission context here - cinematics teach the player what to care about.]\n\n[GAMEPLAY HAND-OFF]\n[Mark exactly where control returns to the player. Write what they can now do.]\n\n[CUTSCENE END]"
  },
  {
    "key": "animation",
    "title": "Animation",
    "desc": "Animated feature/short structure: visual world-building, big feelings, no budget limits.",
    "content": "FADE IN:\n\nEXT. IMPOSSIBLE PLACE - DAY\n\n[Go visual first. Animation sells wonder: describe the world in motion before anyone speaks.]\n\nYOUNG HERO\n[Introduce the hero doing something only animation can do.]\n\n[The want: something small and personal. Animation works best when huge magic serves tiny hearts.]\n\n[The mentor or sidekick - comic relief with one piece of real wisdom.]\n\n[The loss or lie that breaks the world. Let color and music shift here.]\n\n[The dark night: quietest scene in the film. One image says everything.]\n\n[The finale: spectacle powered by the hero's emotional growth, not by force.]\n\n[The new normal - brighter than the opening image.]\n\nFADE OUT."
  },
  {
    "key": "corporate",
    "title": "Corporate / Explainer",
    "desc": "Branded video or explainer: problem, solution, proof, call to action.",
    "content": "[OPENING HOOK - 0:00-0:05]\n[Visual + one line naming the viewer's pain point.]\n\n[PROBLEM - 0:05-0:20]\n[Show life with the problem. Relatable frustration, no product yet.]\n\nNARRATOR (V.O.)\n[Name the cost of the problem in one sentence.]\n\n[SOLUTION - 0:20-0:45]\n[The reveal. Show the product or idea solving the exact problem from above.]\n\nNARRATOR (V.O.)\n[One clear sentence on what it is and who it is for. No jargon.]\n\n[PROOF - 0:45-1:00]\n[Testimonial, number, or demo. Three beats maximum.]\n\nSPEAKER ON CAMERA\n[A real sentence a real customer would say.]\n\n[CALL TO ACTION - 1:00-1:15]\nNARRATOR (V.O.)\n[Tell them exactly what to do next: visit, sign up, subscribe. Then end card.]"
  },
  {
    "key": "stageProper",
    "title": "Stage Play (Proper)",
    "desc": "Professional stage format: centered character, indented dialogue, act/scene with proper margins.",
    "format": "stage",
    "content": "ACT I\n\nScene 1\n\n[ Lights up on a kitchen. Morning. ]\n\n                      JULIA\n          I thought you said you quit.\n\n                      SAM\n          I did. Yesterday.\n\n          [ Sam pours coffee. Julia watches. ]\n\n                      JULIA\n          That was yesterday.\n\nACT II\n\nScene 1\n\n[ Later that night. Same kitchen, darker. ]\n\nCURTAIN."
  },
  {
    "key": "sitcom",
    "title": "TV Sitcom (Multi-Cam)",
    "desc": "Half-hour multi-cam: teaser, two acts, tag — double-spaced, punch-up beats.",
    "format": "tv",
    "content": "FADE IN:\n\nTEASER\n\nINT. APARTMENT - DAY\n\n[A laugh line on page one. Establish the game of the episode.]\n\nCHARACTER A\n[Setup — the lie or misunderstanding that will run the episode.]\n\nCHARACTER B\n[Tag the joke. Studio audience laughs.]\n\nACT ONE\n\nINT. APARTMENT - CONTINUOUS\n\n[The table read of act one: the plan is made. Every fix makes it worse.]\n\nACT TWO\n\nINT. APARTMENT - NIGHT\n\n[The public disaster. The lie blows up in the most embarrassing way.]\n\nTAG\n\nINT. APARTMENT - LATER\n\n[Button. Callback to the teaser. Freeze on laugh.]\n\nFADE OUT."
  },
  {
    "key": "dramaHour",
    "title": "TV Drama Hour",
    "desc": "One-hour drama: teaser + 5 acts + tag, cliffhangers and season arc.",
    "format": "tv",
    "content": "FADE IN:\n\nTEASER\n\nEXT. CITY - NIGHT\n\n[ Cold open that hooks the season question in one image. ]\n\nACT ONE\n\nINT. LOCATION - DAY\n\n[ Ordinary world check-in with the ensemble. ]\n\nACT TWO\n\n[ Complication. The case of the weekderails the season arc. ]\n\nACT THREE\n\n[ Midpoint twist. The goal changes. ]\n\nACT FOUR\n\n[ Bad guys close in. A character makes an irreversible choice. ]\n\nACT FIVE\n\n[ Climax. The case resolves, the arc does not. ]\n\nTAG\n\n[ Quiet tag. Hint of what is coming next. ]\n\nFADE OUT."
  },
  {
    "key": "graphicNovel",
    "title": "Graphic Novel",
    "desc": "Long-form comic: CHAPTER + PAGE/PANEL, CAPTION, SFX, dialogue.",
    "format": "comic",
    "content": "CHAPTER ONE: ARRIVAL\n\nPAGE ONE (5 PANELS)\n\nPanel 1. Wide. City skyline at dusk.\n   CAPTION: The city never sleeps.\n   SFX: HONK HONK\n\nPanel 2. Close on hero.\n   HERO: I thought I left this place.\n\nPanel 3. Detail — hands.\n   CAPTION: But the past has long arms.\n\nPAGE TWO (4 PANELS)\n\nPanel 1. Interior. Kitchen.\n   CHARACTER: You came back.\n\nPanel 2. Reaction.\n   CHARACTER: I had to."
  },
  {
    "key": "comicBook",
    "title": "Comic Book",
    "desc": "22-page issue: PAGE/PANEL with tight CAPTION/SFX and dialogue.",
    "format": "comic",
    "content": "PAGE ONE (6 PANELS)\n\nPanel 1. Splash. Hero silhouette.\n   CAPTION: Day one.\n   SFX: KRAK\n\nPanel 2. Tight on eyes.\n   HERO (THOUGHT): Not again.\n\nPanel 3. Establishing.\n   CHARACTER: We need to talk.\n\nPAGE TWO (5 PANELS)\n\nPanel 1. Two-shot.\n   CHARACTER: You are late.\n\nPanel 2. Close.\n   HERO: Traffic."
  },
  {
    "key": "radioPlay",
    "title": "Radio Play",
    "desc": "Audio-only: ANNCR, MUSIC, SFX cues carry the world.",
    "format": "audio",
    "content": "FADE IN:\n\nANNCR: (V.O.)\nTonight on The Shadow Line...\n\nMUSIC: THEME SWELLS, THEN UNDER.\n\nSFX: RAIN ON WINDOW. CLOCK TICKS.\n\nCHARACTER (FILTERED)\n( on phone )\nYou were supposed to be here an hour ago.\n\nSECOND CHARACTER\n( whispering )\nI am here. You are not looking.\n\nMUSIC: STING. FADE OUT."
  }
]
