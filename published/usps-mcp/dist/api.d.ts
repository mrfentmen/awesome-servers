/**
 * What a postcode actually covers. One code can name a whole city or a single
 * building, and for shipping that difference decides the zone, the rate and
 * whether a delivery is even deliverable, so the places under a code are listed
 * with their coordinates rather than collapsed into one line.
 */
export declare function postalLookup(args: {
    postcode: string;
    country?: string;
}): Promise<string>;
/**
 * A typed address turned into coordinates by the US Census geocoder, with the
 * standardised form it matched. A shipping rate needs a deliverable address, and
 * this is the step that finds out whether what was typed is one.
 */
export declare function addressGeocode(args: {
    address: string;
    reverse?: string;
}): Promise<string>;
