const UA = 'mrfentmen-irail-mcp/1.0';

export async function stations(_args?: unknown): Promise<string> {
  const res = await fetch('https://api.irail.be/v1/stations/?format=json', {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`iRail returned ${res.status}`);
  const d = (await res.json()) as { station?: Array<{ '@id'?: string; name?: string; '@name'?: string; longitude?: number; latitude?: number }> };
  const list = d.station ?? [];
  if (!list.length) return 'No stations returned.';
  const rows = list.slice(0, 20).map((s, i) => `${i + 1}. ${s.name ?? s['@name'] ?? '?'} (${s['@id'] ?? '?'}) at ${s.latitude ?? '?'},${s.longitude ?? '?'}`);
  return `iRail stations (${list.length}, showing 20):\n${rows.join('\n')}`;
}

export interface ConnectionsArgs {
  from: string;
  to: string;
  limit?: number;
}

export async function connections(args: ConnectionsArgs): Promise<string> {
  const from = (args.from ?? '').trim();
  const to = (args.to ?? '').trim();
  if (!from || !to) return 'Provide origin and destination stations.';
  const limit = Math.min(Math.max(Number(args.limit ?? 3) || 3, 1), 10);
  const url = `https://api.irail.be/v1/connections/?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&format=json&results=${limit}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`iRail returned ${res.status}`);
  const d = (await res.json()) as { connection?: Array<{ departure?: { time?: number; delay?: number; station?: string }; arrival?: { time?: number; delay?: number; station?: string } }> };
  const list = d.connection ?? [];
  if (!list.length) return `No connections from ${from} to ${to}.`;
  const fmt = (t: number | undefined) => (t ? new Date(t * 1000).toISOString() : '?');
  return `iRail connections ${from} -> ${to} (${list.length}):\n` +
    list.slice(0, limit).map((c, i) => `${i + 1}. dep ${fmt(c.departure?.time)}${c.departure?.delay ? ` (+${Math.round(Number(c.departure.delay) / 60)}min)` : ''} at ${c.departure?.station ?? '?'} -> arr ${fmt(c.arrival?.time)} at ${c.arrival?.station ?? '?'}`).join('\n');
}

// ---- muxB tools:

const irailText = (row: object, key: string, fallback = 'not reported'): string => {
  const value = (row as Record<string, unknown>)[key];
  return value != null && String(value) !== '' ? String(value) : fallback;
};

const irailClock = (epoch: unknown): string => {
  const seconds = Number(epoch);
  return Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000).toISOString() : '?';
};

const irailDelay = (seconds: unknown): string => {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value === 0) return 'on time';
  return `+${Math.round(value / 60)}min late`;
};

interface IrailVehicleInfo {
  shortname?: string
  number?: string
  type?: string
}

interface IrailStop {
  station?: string
  time?: string
  delay?: string
  platform?: string
  left?: string
  canceled?: string
  occupancy?: { name?: string }
  vehicleinfo?: IrailVehicleInfo
  stationinfo?: { standardname?: string; id?: string }
}

export interface LiveBoardArgs {
  station: string;
  limit?: number;
}

export interface NetworkDisruptionsArgs {
  limit?: number;
}

export interface TrainStopsArgs {
  id: string;
}

export async function trainStops(args: TrainStopsArgs): Promise<string> {
  const id = (args.id ?? '').trim();
  if (!id) throw new Error('Provide a vehicle id, e.g. "BE.NMBS.IC2309".');
  // iRail only holds a journey record for some vehicles, and answers 404 for the
  // rest. That is an answer about the train, not a failure, so say so plainly.
  const res = await fetch(`https://api.irail.be/v1/vehicle/?id=${encodeURIComponent(id)}&format=json`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (res.status === 404) return `iRail holds no journey record for vehicle ${id}. Take an id from the live_board or connections output and try again.`;
  if (!res.ok) throw new Error(`iRail returned ${res.status}`);
  const d = (await res.json()) as { vehicle?: string; vehicleinfo?: IrailVehicleInfo; stops?: { number?: string; stop?: IrailStop[] } };
  const rows = d.stops?.stop ?? [];
  if (!rows.length) return `iRail reported no stops for vehicle ${id}.`;
  const train = d.vehicleinfo?.shortname ?? d.vehicle ?? id;
  return [
    `${train} (${d.vehicleinfo?.type ?? 'type not reported'}) - ${d.stops?.number ?? rows.length} stops:`,
    ...rows.map((r, i) => [
      `  ${i + 1}. ${irailClock(r.time)} ${irailDelay(r.delay)} ${r.stationinfo?.standardname ?? r.station ?? '?'}`,
      `     platform ${irailText(r, 'platform')}${r.occupancy?.name ? ` | occupancy ${r.occupancy.name}` : ''}${r.canceled === '1' ? ' | CANCELLED' : ''}${r.left === '1' ? ' | departed' : ''}`,
    ].join('\n')),
  ].join('\n');
}
