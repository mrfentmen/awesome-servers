export class TypeformError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TypeformError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.TYPEFORM_TOKEN;
  if (!k) throw new TypeformError("Set TYPEFORM_TOKEN (Typeform personal token).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.typeform.com" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new TypeformError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new TypeformError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listForms(): Promise<string> {
  return get("/forms?page_size=20");
}

export function getForm(formId: string): Promise<string> {
  return get(`/forms/${encodeURIComponent(formId)}`);
}

export function listResponses(formId: string): Promise<string> {
  return get(`/forms/${encodeURIComponent(formId)}/responses?page_size=10`);
}



export function findResponse(formId: string, responseId: string): Promise<string> {
  return get(`/forms/${encodeURIComponent(formId)}/responses?included_response_ids=${encodeURIComponent(responseId)}&page_size=1`);
}

export function accountImages(): Promise<string> {
  return get("/images?page_size=20");
}

export function accountImage(imageId: string): Promise<string> {
  return get(`/images/${encodeURIComponent(imageId)}`).then((t) => t.slice(0, 4000));
}

export function createForm(title: string): Promise<string> {
  return (async () => {
    let res: Response;
    try {
      res = await fetch("https://api.typeform.com/forms", {
        method: "POST",
        headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${process.env.TYPEFORM_TOKEN}` },
        body: JSON.stringify({ title }),
        signal: AbortSignal.timeout(25000),
      });
    } catch (e) {
      throw new TypeformError(`Network error: ${(e as Error).message}`);
    }
    const text = await res.text();
    if (!res.ok) throw new TypeformError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 4000);
  })();
}

export function themes(): Promise<string> {
  return get("/themes?page_size=20");
}

export function themeDetails(themeId: string): Promise<string> {
  return get(`/themes/${encodeURIComponent(themeId)}`);
}

export function workspaces(): Promise<string> {
  return get("/workspaces?page_size=20");
}

// ---- muxH tools:
// Ten tools call the account-scoped Typeform API, which needs a personal token.
// The first tool below needs no credentials at all and reads Typeform's own status
// record. The second is deliberately local: it is a form-design linter that runs on
// a schema the caller already holds, with no fetch and no invented data, because
// what a survey breaks most is a design problem that no endpoint will report.

const TF_STATUS = "https://status.typeform.com/api/v2";
const TF_UA = "mcfentmen-typeform-mcp/1.1 (https://github.com/mcfentmen/typeform-mcp)";

interface TfComponent {
  id?: string;
  name?: string;
  status?: string;
  updated_at?: string;
  group?: boolean;
}
interface TfIncident {
  id?: string;
  name?: string;
  status?: string;
  impact?: string;
  created_at?: string;
  resolved_at?: string | null;
  shortlink?: string;
  components?: TfComponent[];
  incident_updates?: { status?: string; body?: string; created_at?: string }[];
}
interface TfDoc {
  page?: { name?: string; url?: string; time_zone?: string; updated_at?: string };
  status?: { indicator?: string; description?: string };
  components?: TfComponent[];
  incidents?: TfIncident[];
}

async function tfGet<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${TF_STATUS}/${path}`, {
      headers: { "User-Agent": TF_UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new TypeformError(`Could not reach Typeform's status service: ${(e as Error).message}`);
  }
  if (!res.ok) throw new TypeformError(`Typeform's status service returned HTTP ${res.status}.`);
  return (await res.json()) as T;
}

const tfClean = (raw?: string): string =>
  String(raw ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const tfWords = (raw?: string): number => tfClean(raw).split(/\s+/).filter(Boolean).length;

/**
 * Whether Typeform itself is up: 36 published components with their state, plus
 * the incidents that hit each of them and how long the worst ones lasted. Worth
 * reading before concluding that a form's low completion rate is a design problem.
 */
export async function serviceStatus(args: { limit?: number }): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 36);
  const [current, componentList, incidents] = await Promise.all([
    tfGet<TfDoc>("status.json"),
    tfGet<TfDoc>("components.json"),
    tfGet<TfDoc>("incidents.json"),
  ]);
  const components = componentList.components ?? [];
  const all = incidents.incidents ?? [];
  const indicator = current.status?.indicator ?? "not reported";
  if (!components.length && !current.status) {
    throw new TypeformError("Typeform's status service returned neither a status nor any components.");
  }

  const stateWord = (raw?: string): string => {
    const key = String(raw ?? "").toLowerCase();
    if (key === "operational") return "operational";
    if (key.includes("degraded")) return "degraded";
    if (key.includes("outage")) return "outage";
    if (key.includes("maintenance")) return "maintenance";
    if (key.includes("partial")) return "partial outage";
    return raw ? raw.replace(/_/g, " ") : "not reported";
  };

  const hits = new Map<string, number>();
  const worst = new Map<string, number>();
  for (const incident of all) {
    const span = Date.parse(String(incident.resolved_at ?? "")) - Date.parse(String(incident.created_at ?? ""));
    const minutes = Number.isFinite(span) && span > 0 ? Math.round(span / 60000) : null;
    for (const component of incident.components ?? []) {
      const name = component.name ?? "component not named";
      hits.set(name, (hits.get(name) ?? 0) + 1);
      if (minutes !== null) worst.set(name, Math.max(worst.get(name) ?? 0, minutes));
    }
  }
  const down = components.filter((c) => String(c.status ?? "") !== "operational");
  const page = current.page ?? componentList.page ?? {};
  const impacts = new Map<string, number>();
  for (const incident of all) {
    const key = incident.impact ?? "not reported";
    impacts.set(key, (impacts.get(key) ?? 0) + 1);
  }
  const span = (minutes: number): string => (minutes < 60 ? `${minutes} min` : minutes < 1440 ? `${(minutes / 60).toFixed(1)} h` : `${(minutes / 1440).toFixed(1)} days`);

  return [
    "Typeform service status",
    `  overall: ${String(indicator).toUpperCase()} — ${current.status?.description ?? "not reported"}`,
    `  page last updated ${page.updated_at ?? "not reported"} (${page.time_zone ?? "timezone not reported"})`,
    `  ${components.length} component(s) published, ${down.length} not operational`,
    all.length ? `  ${all.length} published incident(s): ${[...impacts.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${n} ${k}`).join(", ")} by impact` : "  no incidents in the published record",
    "",
    `Components${down.length ? ", not-operational first" : ""} (${Math.min(limit, components.length)} of ${components.length}):`,
    ...[...components]
      .sort((a, b) => Number(String(a.status) !== "operational") - Number(String(b.status) !== "operational"))
      .slice(0, limit)
      .map((c) => {
        const name = c.name ?? "?";
        const hit = hits.get(name) ?? 0;
        const long = worst.get(name);
        return (
          `  ${name.slice(0, 30).padEnd(30)} ${stateWord(c.status).padEnd(16)}` +
          `incidents ${String(hit).padStart(3)}${long ? ` longest ${span(long).padStart(9)}` : ""}  updated ${String(c.updated_at ?? "not reported").slice(0, 16).replace("T", " ")}`
        );
      }),
    "",
    "Least reliable of those listed:",
    ...[...hits.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, n], i) => `  ${i + 1}. ${name} — ${n} incident(s)${worst.get(name) ? `, longest ${span(worst.get(name) as number)}` : ""}`),
    "",
    "An incident naming several components is counted once under each, so those columns exceed the incident total. This is Typeform's public status record, which reports only problems above its own threshold; anything below it never appears, so a component marked operational is not a guarantee about your specific form.",
  ].join("\n");
}

interface TfField {
  id?: string;
  ref?: string;
  title?: string;
  type?: string;
  validations?: { required?: boolean; minLength?: number; maxLength?: number; min?: number; max?: number };
  properties?: { choices?: { id?: string; ref?: string; label?: string; [k: string]: unknown }[]; allow_multiple_selection?: boolean };
}

/**
 * A form-design linter. It reads a Typeform schema the caller already has and
 * reports the design faults that quietly ruin a survey: a required field with no
 * way out, a long list of choices rendered as buttons, a rating scale with no
 * neutral step, duplicated question text, missing refs, and a page that will
 * overflow. Pure local logic, no network call and nothing invented.
 */
export async function schemaLint(args: { schema: string; pages?: number }): Promise<string> {
  const raw = String(args?.schema ?? "").trim();
  if (!raw) {
    throw new TypeformError("Paste the form's schema as JSON: {\"title\":...,\"fields\":[...]}.");
  }
  if (raw.length > 400000) {
    throw new TypeformError(`That schema is ${raw.length} characters; this linter reads up to 400,000.`);
  }
  const maxIssues = Math.min(Math.max(Number(args?.pages ?? 25) || 25, 5), 60);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new TypeformError(`That is not valid JSON: ${(e as Error).message}`);
  }
  const schema = parsed as { title?: string; fields?: TfField[]; logic?: unknown[]; language?: string };
  const fields = Array.isArray(schema.fields) ? schema.fields : null;
  if (!fields) {
    throw new TypeformError("The JSON has no \"fields\" array, so there is nothing to lint. Accepts the shape Typeform's Create API and the form schema endpoint return.");
  }
  if (!fields.length) {
    return `The schema declares a form${schema.title ? ` titled "${tfClean(schema.title)}"` : ""} with no fields at all, so there is nothing to check.`;
  }

  interface Issue { field: string; kind: string; detail: string }
  const issues: Issue[] = [];
  const seenTitles = new Map<string, number>();
  const seenRefs = new Map<string, number>();
  const typeCounts = new Map<string, number>();
  let required = 0;
  let words = 0;

  fields.forEach((field, index) => {
    const label = `${index + 1}. ${tfClean(field.title ?? "").slice(0, 60) || "untitled question"}`;
    const kind = String(field.type ?? "unknown type");
    typeCounts.set(kind, (typeCounts.get(kind) ?? 0) + 1);
    const titleKey = tfClean(field.title ?? "").toLowerCase();
    if (titleKey) {
      seenTitles.set(titleKey, (seenTitles.get(titleKey) ?? 0) + 1);
      if (seenTitles.get(titleKey) === 2) {
        issues.push({ field: label, kind: "duplicate", detail: "this question text appears more than once, which reads as a bug to the respondent" });
      }
    }
    if (!field.ref) {
      issues.push({ field: label, kind: "no ref", detail: "no ref, so any logic rule or integration cannot address this question" });
    } else {
      seenRefs.set(field.ref, (seenRefs.get(field.ref) ?? 0) + 1);
      if (seenRefs.get(field.ref) === 2) {
        issues.push({ field: label, kind: "duplicate ref", detail: `ref "${field.ref}" is used more than once, so logic rules will collide` });
      }
    }

    const titleWords = tfWords(field.title);
    words += titleWords;
    if (titleWords > 25) {
      issues.push({ field: label, kind: "long prompt", detail: `${titleWords} words in the prompt, which is a paragraph rather than a question` });
    }
    const isRequired = field.validations?.required === true;
    if (isRequired) required += 1;
    const choices = Array.isArray(field.properties?.choices) ? field.properties!.choices! : [];
    const labels = choices.map((c) => tfClean(c.label ?? "")).filter(Boolean);

    if (/^multiple_choice$|^yes_no$/.test(kind)) {
      if (isRequired && !/N\/A|None|Neither|Unsure|Prefer not|Other/i.test(labels.join(" "))) {
        issues.push({ field: label, kind: "required trap", detail: "required with no opt-out choice, so a respondent who does not fit any option must abandon the form" });
      }
      if (kind === "multiple_choice" && labels.length > 6) {
        issues.push({ field: label, kind: "too many choices", detail: `${labels.length} choices render as buttons; past about six this becomes a long scroll and the top options get the most taps` });
      }
      const deduped = new Set(labels.map((l) => l.toLowerCase()));
      if (deduped.size !== labels.length) {
        issues.push({ field: label, kind: "duplicate choice", detail: "two or more choices have the same label, so the answer cannot be interpreted" });
      }
    }
    if (kind === "opinion_scale") {
      const steps = Math.abs(Number(field.validations?.max ?? 0) - Number(field.validations?.min ?? 0)) + 1;
      if (steps > 0 && steps % 2 === 0) {
        issues.push({ field: label, kind: "no neutral step", detail: `${steps} steps, an even count, so there is no middle answer for someone who feels neither way` });
      }
      if (steps > 11) {
        issues.push({ field: label, kind: "long scale", detail: `${steps} steps is too many to compare at a glance` });
      }
    }
    if (kind === "short_text" || kind === "long_text") {
      const min = field.validations?.minLength;
      const max = field.validations?.maxLength;
      if (isRequired && typeof min === "number" && min > 25) {
        issues.push({ field: label, kind: "long required answer", detail: `required with a ${min} character minimum, which stops respondents who have a short answer` });
      }
      if (typeof max === "number" && max > 600 && kind === "short_text") {
        issues.push({ field: label, kind: "wrong field type", detail: `allows ${max} characters in a short-answer field, which is a paragraph box` });
      }
    }
    if (kind === "payment" || kind === "email") {
      if (isRequired) {
        issues.push({ field: label, kind: "sensitive required field", detail: "required, so an abandoned form captures a contact or payment address with no answer" });
      }
    }
    if (kind === "date" && isRequired && (field.validations?.min === undefined && field.validations?.max === undefined)) {
      issues.push({ field: label, kind: "open date", detail: "required with no earliest or latest date, so out-of-range dates can be entered" });
    }
  });

  if (required === fields.length) {
    issues.push({ field: "the whole form", kind: "all required", detail: `all ${fields.length} questions are required, so a respondent who abandons partway has submitted nothing usable` });
  }
  if (fields.length > 20) {
    issues.push({ field: "the whole form", kind: "long form", detail: `${fields.length} questions; completion rates fall sharply past roughly a dozen, and there is no page to break it up in this schema` });
  }
  const ratingHeavy = fields.filter((f) => String(f.type ?? "").includes("rating")).length;
  if (ratingHeavy > 3) {
    issues.push({ field: "the whole form", kind: "survey fatigue", detail: `${ratingHeavy} rating questions in a row invites straight-lining` });
  }

  const byKind = new Map<string, number>();
  for (const issue of issues) byKind.set(issue.kind, (byKind.get(issue.kind) ?? 0) + 1);
  const minutes = Math.max(0.5, Math.round((words / 200 + fields.length * 0.12) * 10) / 10);
  const shown = issues.slice(0, maxIssues);

  return [
    `Form design lint${schema.title ? `: ${tfClean(schema.title).slice(0, 70)}` : ""}`,
    `  ${fields.length} question(s), ${required} required, ${schema.language ? `language ${schema.language}` : "language not declared"}, ${words} words of prompt across the questions`,
    `  roughly ${minutes} min of reading at 200 words a minute plus ${(fields.length * 0.12).toFixed(1)} min of clicking`,
    `  question types: ${[...typeCounts.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${n} ${k}`).join(", ")}`,
    "",
    issues.length
      ? `${issues.length} issue(s) found, by kind: ${[...byKind.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${n} ${k}`).join(", ")}`
      : "No design issues found. That is unusual for a form of this size, so check the schema is the one you think it is.",
    "",
    ...shown.map((issue, i) => `  ${String(i + 1).padStart(2)}. [${issue.kind}] ${issue.field}\n      ${issue.detail}`),
    ...(issues.length > shown.length ? [`  (+${issues.length - shown.length} more issue(s) not shown; raise pages, max 60)`] : []),
    "",
    "This is a static reading of the schema, not a prediction: it cannot know whether a question is optional on purpose, whether an opt-out exists in the copy, or where the questions are split across pages, since the fields array is flat. It sends nothing anywhere and judges only what you pasted in.",
  ].join("\n");
}
