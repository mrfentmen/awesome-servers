/**
 * FuelEconomy.gov client, keyless.
 * The public REST service at /ws/rest returns XML for menus and accepts JSON for fuel prices.
 */
export declare class FuelError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
/** Pull `<tag>value</tag>` pairs out of a flat XML document. */
export declare function xmlFields(xml: string): Record<string, string>;
/** Pull the `<menuItem><text>..</text><value>..</value></menuItem>` rows out of a menu document. */
export declare function xmlMenu(xml: string): Array<{
    text: string;
    value: string;
}>;
export interface Vehicle {
    id: string;
    year: string;
    make: string;
    model: string;
    transmission: string;
    drive: string;
    fuel: string;
    cylinders: string;
    displacement: string;
    vehicleClass: string;
    city: string;
    highway: string;
    combined: string;
    co2: string;
    annualFuelCost: string;
    ghgScore: string;
    feScore: string;
    range: string;
}
export declare function toVehicle(f: Record<string, string>): Vehicle;
export declare function formatVehicle(v: Vehicle): string;
export declare function listYears(): Promise<string[]>;
export declare function listMakes(year: string): Promise<Array<{
    text: string;
    value: string;
}>>;
export declare function listModels(year: string, make: string): Promise<Array<{
    text: string;
    value: string;
}>>;
export declare function listOptions(year: string, make: string, model: string): Promise<Array<{
    text: string;
    value: string;
}>>;
export declare function vehicleDetails(vehicleId: string): Promise<Vehicle>;
export declare function compareVehicles(vehicleIds: string[]): Promise<string>;
export interface FuelPrices {
    regular: string;
    midgrade: string;
    premium: string;
    diesel: string;
    e85: string;
    cng: string;
    lpg: string;
    electric: string;
}
export declare function fuelPrices(): Promise<string>;
/** Annual fuel cost for one vehicle at a chosen mileage, from the EPA record. */
export declare function runningCost(args: {
    vehicle_id: string;
    miles_per_year?: number;
    fuel_price?: number;
}): Promise<string>;
/** Ranks two to six vehicles by estimated annual fuel cost at the same mileage. */
export declare function compareCosts(args: {
    vehicle_ids: string;
    miles_per_year?: number;
    fuel_price?: number;
}): Promise<string>;
export interface ModelRecallsArgs {
    year: number;
    make: string;
    model: string;
    limit: number;
}
export interface ModelComplaintsArgs {
    year: number;
    make: string;
    model: string;
    limit: number;
}
