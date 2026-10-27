/**
 * How UptimeRobot's own service has been behaving, from its public status board:
 * every monitor it publishes, its uptime ratio over the whole window and over 30
 * and 90 days, and the days it was not at full availability.
 */
export declare function vendorUptime(args: {
    limit?: number;
}): Promise<string>;
