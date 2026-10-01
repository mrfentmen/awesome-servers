export class StatuspageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StatuspageError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.STATUSPAGE_API_KEY;
  if (!k) throw new StatuspageError("Set STATUSPAGE_API_KEY (Statuspage API key).");
  return { ...UA, Accept: "application/json", Authorization: `OAuth ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.statuspage.io/v1" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new StatuspageError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new StatuspageError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listPages(): Promise<string> {
  return get("/pages");
}

export function getPage(pageId: string): Promise<string> {
  return get(`/pages/${encodeURIComponent(pageId)}`);
}

export function listIncidents(pageId: string): Promise<string> {
  return get(`/pages/${encodeURIComponent(pageId)}/incidents?limit=10`);
}



export function incidentDetails(pageId: string, incidentId: string): Promise<string> {
  return get(`/pages/${encodeURIComponent(pageId)}/incidents/${encodeURIComponent(incidentId)}`);
}

export function incidentUpdates(pageId: string, incidentId: string): Promise<string> {
  return get(`/pages/${encodeURIComponent(pageId)}/incidents/${encodeURIComponent(incidentId)}/incident_updates`);
}

export function components(pageId: string): Promise<string> {
  return get(`/pages/${encodeURIComponent(pageId)}/components`);
}

export function componentDetails(pageId: string, componentId: string): Promise<string> {
  return get(`/pages/${encodeURIComponent(pageId)}/components/${encodeURIComponent(componentId)}`);
}

export function subscribers(pageId: string): Promise<string> {
  return get(`/pages/${encodeURIComponent(pageId)}/subscribers?limit=20`);
}

export function upcomingMaintenance(pageId: string): Promise<string> {
  return get(`/pages/${encodeURIComponent(pageId)}/scheduled-maintenances/upcoming`);
}

export function maintenanceDetails(pageId: string, maintenanceId: string): Promise<string> {
  return get(`/pages/${encodeURIComponent(pageId)}/scheduled-maintenances/${encodeURIComponent(maintenanceId)}`);
}
