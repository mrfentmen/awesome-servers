export class CalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CalError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.CAL_API_KEY;
  if (!k) throw new CalError("Set CAL_API_KEY (Cal.com API key).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}`, "cal-api-version": "2024-06-14" };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.cal.com" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new CalError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new CalError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listEventTypes(): Promise<string> {
  return get("/v2/event-types");
}

export function listBookings(): Promise<string> {
  return get("/v2/bookings");
}

export function listSchedules(): Promise<string> {
  return get("/v2/schedules");
}

