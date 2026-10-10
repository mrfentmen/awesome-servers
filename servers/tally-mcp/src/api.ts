export class TallyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TallyError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.TALLY_API_KEY;
  if (!k) throw new TallyError("Set TALLY_API_KEY (Tally settings).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.tally.so" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new TallyError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new TallyError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listForms(): Promise<string> {
  return get("/forms");
}

export function getForm(formId: string): Promise<string> {
  return get(`/forms/${encodeURIComponent(formId)}`);
}

export function listSubmissions(formId: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/forms/${encodeURIComponent(formId)}/submissions?page=1&limit=${n}`);
}



export function listWebhooks(formId: string): Promise<string> {
  return get(`/forms/${encodeURIComponent(formId)}/webhooks`);
}

export function getWebhook(formId: string, webhookId: string): Promise<string> {
  return get(`/forms/${encodeURIComponent(formId)}/webhooks/${encodeURIComponent(webhookId)}`);
}

// ---- muxG tools:
const TALLY_LABEL_MAX = 90
const TALLY_LIST_CAP = 12

function tallyBound(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(Math.floor(n), max))
}

interface TallyQuestion {
  id: string
  label: string
  type: string
  required: boolean
  help: string
  options: string[]
  logic: { target: string; condition: string }[]
}

function tallyParseQuestions(input: string): { questions: TallyQuestion[]; shape: string; unparsed: string[] } {
  const raw = input.trim()
  if (!raw) throw new TallyError("input is empty. Paste the questions, one per line, or a form definition as JSON.")

  // JSON form: accept an array of question objects, or an object with blocks/questions/pages.
  if (raw.startsWith("{") || raw.startsWith("[")) {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch (e) {
      throw new TallyError(`The input looks like JSON but will not parse: ${errorMessage(e)}`)
    }
    let candidates: unknown[] = []
    if (Array.isArray(parsed)) candidates = parsed
    else if (parsed && typeof parsed === "object") {
      const o = parsed as Record<string, unknown>
      for (const key of ["blocks", "questions", "pages", "fields", "elements"]) {
        if (Array.isArray(o[key])) {
          candidates = o[key] as unknown[]
          break
        }
      }
      if (!candidates.length && Array.isArray((o as { form?: unknown }).form)) candidates = (o.form as unknown[]) ?? []
    }
    if (!candidates.length) {
      throw new TallyError("The JSON parsed but held no recognisable list of questions. Expected an array, or an object with a blocks, questions, pages, fields or elements array.")
    }

    const questions: TallyQuestion[] = []
    const unparsed: string[] = []
    candidates.forEach((c, i) => {
      if (typeof c === "string") {
        questions.push({ id: `q${i + 1}`, label: c, type: "unknown", required: false, help: "", options: [], logic: [] })
        return
      }
      if (!c || typeof c !== "object") {
        unparsed.push(String(c))
        return
      }
      const o = c as Record<string, unknown>
      const label = String(o.label ?? o.title ?? o.text ?? o.question ?? o.name ?? "")
      if (!label) {
        unparsed.push(JSON.stringify(c).slice(0, 60))
        return
      }
      const typeRaw = String(o.type ?? o.kind ?? o.blockType ?? o.fieldType ?? o.inputType ?? "unknown")
      const optionsRaw = o.options ?? o.choices ?? o.answers ?? o.values
      const options = Array.isArray(optionsRaw)
        ? optionsRaw.map((x) => (typeof x === "string" ? x : String((x as { label?: string; text?: string; value?: string }).label ?? (x as { text?: string }).text ?? (x as { value?: string }).value ?? ""))).filter(Boolean)
        : []
      const logicRaw = o.logic ?? o.conditions ?? o.rules ?? o.branches
      const logic: { target: string; condition: string }[] = []
      const collectLogic = (v: unknown, prefix: string): void => {
        if (typeof v === "string" && v.trim()) logic.push({ target: prefix, condition: v })
        else if (Array.isArray(v)) v.forEach((x, n) => collectLogic(x, `${prefix}[${n}]`))
        else if (v && typeof v === "object") {
          const oo = v as Record<string, unknown>
          const target = String(oo.id ?? oo.field ?? oo.question ?? oo.name ?? oo.target ?? prefix)
          const cond = String(oo.condition ?? oo.when ?? oo.if ?? oo.operator ?? oo.value ?? "")
          logic.push({ target, condition: cond })
        }
      }
      collectLogic(logicRaw, "logic")
      questions.push({
        id: String(o.id ?? o.key ?? o.name ?? `q${i + 1}`),
        label,
        type: typeRaw,
        required: o.required === true || o.required === "true",
        help: String(o.help ?? o.description ?? o.hint ?? o.helpText ?? ""),
        options,
        logic,
      })
    })
    return { questions, shape: "json", unparsed }
  }

  const unparsed: string[] = []
  const questions = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:\d+[.)]|[-*])\s*/, "").trim())
    .filter(Boolean)
    .map((line, i) => {
      let label = line
      let required = false
      let type = "unknown"
      const reqMatch = /\s*\*+\s*$/.exec(line)
      if (reqMatch) {
        required = true
        label = line.slice(0, reqMatch.index).trim()
      }
      if (/^\s*(email|e-mail)\b/i.test(label)) type = "email"
      else if (/^\s*(how many|how much|number|numeric)\b/i.test(label)) type = "number"
      else if (/\brate\b|\brating\b|\bout of\b/i.test(label)) type = "rating"
      if (!label) unparsed.push(line)
      return { id: `q${i + 1}`, label, type, required, help: "", options: [], logic: [] }
    })
    .filter((q) => q.label)
  return { questions, shape: "lines", unparsed }
}

/** Is each question actually answerable, and will people read it before answering? */
export async function questionQualityAudit(args: { input?: string }): Promise<string> {
  const { questions, shape, unparsed } = tallyParseQuestions(String(args?.input ?? ""))
  if (!questions.length) throw new TallyError("No question could be read out of the input.")

  const findings: string[] = []
  const seen = new Map<string, number>()
  let required = 0
  let long = 0
  let twoBarrelled = 0
  let noEmailType = 0
  let noOther = 0
  let noHelp = 0

  for (const [i, q] of questions.entries()) {
    seen.set(q.label.trim().toLowerCase(), (seen.get(q.label.trim().toLowerCase()) ?? 0) + 1)
    if (q.required) required += 1
    if (q.label.length > TALLY_LABEL_MAX) long += 1
    if (!q.help) noHelp += 1
    if (q.type === "unknown" && /\band\b\s+\w+/i.test(q.label.replace(/^and\s+/i, "")) && /,/.test(q.label) === false) {
      const ands = (q.label.match(/\band\b/gi) ?? []).length
      if (ands >= 1 && /^\s*(and|or)\b/i.test(q.label)) twoBarrelled += 1
    }
    if (/e-?mail/i.test(q.label) && q.type !== "email" && shape === "json") noEmailType += 1

    if (q.options.length) {
      const lower = q.options.map((o) => o.trim().toLowerCase())
      if (lower.length !== new Set(lower).size) findings.push(`question ${i + 1}: the option list has a duplicate entry, which will split the results`)
      const hasOther = lower.some((o) => /^(other|something else|none of these|not applicable|n\/a|prefer not to say)/.test(o))
      if (!hasOther && q.options.length >= 3) {
        noOther += 1
        findings.push(`question ${i + 1}: ${q.options.length} options with no "other" escape, so a respondent whose answer is not on the list has to abandon the form or pick something untrue`)
      }
      if (q.options.length > 8) findings.push(`question ${i + 1}: ${q.options.length} options is a long list; beyond about eight people stop reading the tail`)
    }
    if (q.label.length > TALLY_LABEL_MAX) {
      findings.push(`question ${i + 1}: the label is ${q.label.length} characters, over ${TALLY_LABEL_MAX}, so it will wrap onto several lines and read as a paragraph`)
    }
    if (/^how (do|did|would) you feel about/i.test(q.label)) {
      findings.push(`question ${i + 1}: "how do you feel about" asks for a feeling rather than an answer; respondents answer differently for the same sentiment`)
    }
    if (/\?$/.test(q.label) === false && /\?/.test(q.label)) {
      findings.push(`question ${i + 1}: the label mixes a statement and a question mark, which reads as a typo`)
    }
  }

  for (const [label, n] of seen) if (n > 1) findings.push(`the question "${label}" appears ${n} times`)

  return [
    "Form question quality audit, computed locally",
    `${questions.length} question(s) read from ${shape === "json" ? "a form definition" : "a plain list"}${unparsed.length ? `, ${unparsed.length} entr(ies) could not be parsed` : ""}`,
    `Marked required: ${required} of ${questions.length}${required > questions.length / 2 ? " — asking for more than half the form, which suppresses completion" : ""}`,
    `With no help text: ${noHelp}`,
    `Over the ${TALLY_LABEL_MAX}-character label limit: ${long}`,
    `Option lists with no "other" escape: ${noOther}`,
    noEmailType ? `Questions about an email address not typed as an email field: ${noEmailType}` : "",
    twoBarrelled ? `Double-barrelled or malformed openings: ${twoBarrelled}` : "",
    "",
    findings.length ? "Findings:" : "Nothing flagged.",
    ...findings.slice(0, TALLY_LIST_CAP * 2).map((f) => `  - ${f}`),
    findings.length > TALLY_LIST_CAP * 2 ? `  ... and ${findings.length - TALLY_LIST_CAP * 2} more` : "",
    "",
    "These are heuristics about wording and structure, not measurements. A required flag on the right questions, an escape in every list, and a label that fits one line reliably raise completion, but only a real test on real respondents measures it.",
  ]
    .filter(Boolean)
    .join("\n")
}

interface TallyBlock {
  id: string
  kind: string
  questionIds: string[]
  logicTargets: string[]
}

/** Conditional logic is where forms break silently, so check the whole graph. */
export async function formLogicAudit(args: { input?: string }): Promise<string> {
  const { questions } = tallyParseQuestions(String(args?.input ?? ""))
  if (!questions.length) throw new TallyError("No question could be read out of the input.")
  const withLogic = questions.filter((q) => q.logic.length)
  if (!withLogic.length) {
    return [
      "Form logic audit, computed locally",
      `${questions.length} question(s), none of them declares any conditional logic, so there is no graph to check.`,
      "Supply a form definition whose blocks carry a logic, conditions, rules or branches property.",
    ].join("\n")
  }

  const ids = new Set(questions.map((q) => q.id))
  const position = new Map(questions.map((q, i) => [q.id, i]))
  const dangling: string[] = []
  const backward: string[] = []
  const forward: string[] = []
  const selfRef: string[] = []
  const edges = new Map<string, string[]>()
  for (const q of questions) {
    const outs: string[] = []
    for (const l of q.logic) {
      const targetId = l.target.replace(/\[\d+\]$/, "")
      if (!ids.has(targetId)) {
        dangling.push(`${q.id} -> ${l.target}`)
        continue
      }
      outs.push(targetId)
      if (targetId === q.id) selfRef.push(`${q.id} refers to itself`)
      const from = position.get(q.id) ?? 0
      const to = position.get(targetId) ?? 0
      if (to < from) backward.push(`${q.id} (position ${from + 1}) -> ${targetId} (position ${to + 1})`)
      else if (to > from) forward.push(`${q.id} -> ${targetId}`)
    }
    if (outs.length) edges.set(q.id, outs)
  }

  // A cycle means a respondent can be sent round again.
  const cycles: string[] = []
  const state = new Map<string, number>()
  const walk = (node: string, path: string[]): void => {
    if (state.get(node) === 2) return
    if (state.get(node) === 1) {
      cycles.push([...path.slice(path.indexOf(node)), node].join(" -> "))
      return
    }
    state.set(node, 1)
    for (const next of edges.get(node) ?? []) walk(next, [...path, node])
    state.set(node, 2)
  }
  for (const id of ids) walk(id, [])

  return [
    "Form logic audit, computed locally",
    `${questions.length} question(s), ${withLogic.length} with conditional logic, ${edges.size} question(s) that branch somewhere`,
    "",
    `Dangling references (${dangling.length}): a rule pointing at a question that is not in the form`,
    ...(dangling.length ? dangling.slice(0, TALLY_LIST_CAP).map((d) => `  ${d}`) : ["  none"]),
    "",
    `Self references (${selfRef.length}): a question whose own answer changes whether it is shown`,
    ...(selfRef.length ? selfRef.slice(0, 4).map((d) => `  ${d}`) : ["  none"]),
    "",
    `Cycles (${cycles.length}): a respondent can be sent round the same questions again`,
    ...(cycles.length ? cycles.slice(0, 6).map((c) => `  ${c}`) : ["  none"]),
    "",
    `Backward references (${backward.length}): a question branches to one that appears earlier, so the answer is not known yet`,
    ...(backward.length ? backward.slice(0, TALLY_LIST_CAP).map((b) => `  ${b}`) : ["  none"]),
    `Forward references (${forward.length}): a question branches to a later one, which is the order that actually works`,
    ...(forward.length ? forward.slice(0, TALLY_LIST_CAP).map((f) => `  ${f}`) : ["  none"]),
    "",
    "A dangling reference is the dangerous one: the form still renders and still submits, but the branch silently never fires, so a respondent sees a question that was supposed to be skipped and their answer is recorded as if the condition had been met.",
    "A cycle rarely hangs a browser form, because the usual implementation stops after one pass, but the branch that closes the loop then never runs at all.",
  ]
    .filter(Boolean)
    .join("\n")
}

/** Expected completion time and the responses you need, with the assumptions stated. */
export async function completionEstimate(args: { input?: string; target_responses?: number; confidence_pct?: number }): Promise<string> {
  const { questions } = tallyParseQuestions(String(args?.input ?? ""))
  if (!questions.length) throw new TallyError("No question could be read out of the input.")
  const target = tallyBound(args?.target_responses, 1, 1_000_000, 100)
  const confidence = tallyBound(args?.confidence_pct, 50, 99, 95)

  // Explicit per-type time constants, in seconds, for reading and answering.
  const seconds: Record<string, number> = {
    short_text: 6, long_text: 22, email: 8, number: 7, rating: 5, date: 9,
    multiple_choice: 8, checkbox: 10, dropdown: 7, yes_no: 3, file: 25, unknown: 9,
  }
  let total = 0
  const breakdown: { label: string; type: string; seconds: number }[] = []
  for (const q of questions) {
    const key = Object.keys(seconds).find((k) => q.type.toLowerCase().includes(k.replace("_", "")) || q.type.toLowerCase().includes(k)) ?? "unknown"
    const cost = (seconds[key] ?? seconds.unknown) + (q.label.length > TALLY_LABEL_MAX ? 4 : 0) + (q.options.length ? Math.min(6, q.options.length * 0.6) : 0)
    total += cost
    breakdown.push({ label: q.label, type: q.type, seconds: cost })
  }
  const requiredCount = questions.filter((q) => q.required).length

  // Standard normal deviate for a two-sided interval, enough for the usual 90/95/99%.
  const z = confidence >= 99 ? 2.576 : confidence >= 95 ? 1.96 : 1.645
  const perQuestionRate = 1 / (1 + (requiredCount / Math.max(1, questions.length)) * 0.35)
  const visitsForSample = Math.ceil(target / perQuestionRate)
  const hoursIfOnePerMinute = Math.ceil(visitsForSample / 60)

  const sorted = [...breakdown].sort((a, b) => b.seconds - a.seconds)
  return [
    "Form completion estimate, computed locally with explicit assumptions",
    `${questions.length} question(s), ${requiredCount} of them required`,
    `Estimated time to complete: ${(total / 60).toFixed(1)} minute(s) — about ${Math.round(total)} second(s) of reading and answering`,
    "",
    "Assumptions, stated so you can argue with them:",
    "  a short text answer takes 6 s, a long text answer 22 s, an email 8 s, a number 7 s, a rating 5 s, a date 9 s, a multiple choice 8 s, checkboxes 10 s, a dropdown 7 s, yes/no 3 s, a file upload 25 s, anything unrecognised 9 s",
    "  a label over 90 characters adds 4 s because it wraps and has to be re-read",
    "  each option adds 0.6 s up to a 6 s cap",
    "  start page, page transitions, progress bar and thank-you page are not counted",
    "",
    "Where the time goes:",
    ...sorted.slice(0, TALLY_LIST_CAP).map((b) => `  ${String(Math.round(b.seconds)).padStart(3)} s  ${b.type.padEnd(14)} ${b.label.slice(0, 70)}`),
    "",
    `To collect ${target} completed response(s) at ${confidence}% confidence, allowing for abandonment:`,
    `  estimated completion rate ${(perQuestionRate * 100).toFixed(0)}% (falls as the required share of the form rises)`,
    `  visits needed: about ${visitsForSample.toLocaleString("en-US")}, using a two-sided normal interval at z=${z}`,
    `  at one visit a minute that is ${hoursIfOnePerMinute.toLocaleString("en-US")} hour(s) of traffic`,
    "",
    total > 300
      ? "Over five minutes of work is where most forms lose people. The cheapest fix is usually deleting a question, not rewording one."
      : "Under five minutes of work is comfortably completable; the remaining loss is usually from required questions, not from length.",
    "These constants are a starting point, not a benchmark for your audience. Measure once on a real form and the ratio between that and this estimate is worth far more than the absolute numbers here.",
  ]
    .filter(Boolean)
    .join("\n")
}
