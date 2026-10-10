export class MoonError extends Error {}

const SYNODIC = 29.53058867
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14)

function phaseFor(date: Date): { age: number; illumination: number; name: string } {
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86400000
  const age = ((days % SYNODIC) + SYNODIC) % SYNODIC
  const illumination = (1 - Math.cos((2 * Math.PI * age) / SYNODIC)) / 2
  const pct = age / SYNODIC
  let name: string
  if (pct < 0.025 || pct >= 0.975) name = "New Moon"
  else if (pct < 0.225) name = "Waxing Crescent"
  else if (pct < 0.275) name = "First Quarter"
  else if (pct < 0.475) name = "Waxing Gibbous"
  else if (pct < 0.525) name = "Full Moon"
  else if (pct < 0.725) name = "Waning Gibbous"
  else if (pct < 0.775) name = "Last Quarter"
  else name = "Waning Crescent"
  return { age, illumination, name }
}

export async function moonPhase(_args: Record<string, never>): Promise<string> {
  const p = phaseFor(new Date())
  return `Moon phase: ${p.name}\nIllumination: ${(p.illumination * 100).toFixed(1)}%\nAge: ${p.age.toFixed(1)} days\nNext full moon estimated within the current cycle`
}

export async function moonOnDate(args: { date?: string }): Promise<string> {
  const d = args.date ? new Date(args.date + "T12:00:00Z") : new Date()
  if (Number.isNaN(d.getTime())) throw new MoonError("Invalid date, use YYYY-MM-DD")
  const p = phaseFor(d)
  return `${d.toISOString().slice(0, 10)}: ${p.name} (${(p.illumination * 100).toFixed(1)}% illuminated)`
}

// ---- muxB tools:

type PhaseRow = { day?: number; month?: number; year?: number; phase?: string; time?: string }

type Phenomenon = { phen?: string; time?: string }
type OneDay = {
  properties?: {
    data?: {
      moondata?: Phenomenon[];
      sundata?: Phenomenon[];
      fracillum?: string;
      curphase?: string;
      closestphase?: { day?: number; month?: number; year?: number; phase?: string; time?: string };
      tz?: number;
    };
  };
};

