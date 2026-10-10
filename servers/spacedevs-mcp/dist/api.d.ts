/**
 * Space launches, satellites, radio frequencies, news and space weather - keyless.
 *
 * Upstreams:
 *   - rocketlaunch.live        upcoming launches worldwide
 *   - db.satnogs.org           satellite catalogue, TLE element sets, transmitters
 *   - spaceflightnewsapi.net   space news and blog posts
 *   - services.swpc.noaa.gov   NOAA space weather (Kp index, solar wind, scales)
 *
 * The Space Devs' Launch Library used to back this server, but it rate-limits
 * anonymous callers after a handful of requests, which cannot carry a paid
 * Actor. Celestrak was trialled for the orbit tools and dropped as well: it
 * refuses repeat group downloads for two hours at a time. Every source used
 * here answers without a key and without a per-caller quota.
 */
export declare class SpacedevsError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function nextLaunches(limit?: number, provider?: string): Promise<string>;
export declare function launchCountdown(): Promise<string>;
export declare function satelliteSearch(query: string, limit?: number): Promise<string>;
export declare function satelliteOrbit(noradId: number): Promise<string>;
export declare function satelliteFrequencies(noradId: number, limit?: number): Promise<string>;
export declare function spaceNews(query: string | undefined, limit?: number): Promise<string>;
export declare function spaceBlogs(query: string | undefined, limit?: number): Promise<string>;
export declare function spaceWeather(): Promise<string>;
export declare function spaceAgencies(query?: string, type?: string, limit?: number): Promise<string>;
export declare function astronauts(query?: string, inSpace?: boolean, limit?: number): Promise<string>;
export declare function launchVehicles(query: string, limit?: number): Promise<string>;
export declare function upcomingEvents(eventType?: string, limit?: number): Promise<string>;
/**
 * How far south the aurora will be visible, read from NOAA's own global aurora
 * grid. The published product is 65,160 latitude/longitude points each carrying an
 * intensity, which no one reads directly; this reduces it to the equatorward edge
 * and the latitude bands that carry the oval.
 */
export declare function auroraReach(args: {
    threshold?: number;
}): Promise<string>;
