export declare class SquarespaceError extends Error {
}
export interface Product {
    id: string;
    name?: string;
    price?: string;
    url?: string;
}
export declare function listProducts(limit?: number): Promise<Product[]>;
export interface Order {
    id: string;
    created?: string;
    total?: string;
    email?: string;
}
export declare function listOrders(limit?: number): Promise<Order[]>;
export declare function formatProduct(p: Product, index?: number): string;
export declare function formatOrder(o: Order, index?: number): string;
/**
 * The registration record of a domain, from the registry's own RDAP service: who
 * holds it, when it was first registered, when it expires, what locks are on it,
 * which nameservers answer, and whether DNSSEC is signed. Every site owner needs
 * this and no commerce endpoint returns it.
 */
export declare function domainRegistration(args: {
    domain: string;
}): Promise<string>;
/**
 * What the W3C's Nu validator makes of a published page: the errors and warnings
 * grouped by rule, the first of each with a line number, and the document type it
 * detected. This is the check to run before shipping markup, and it catches the
 * errors a browser silently tolerates.
 */
export declare function pageValidation(args: {
    url: string;
    limit?: number;
}): Promise<string>;
