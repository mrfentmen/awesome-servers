export interface InvoiceItem {
    description: string;
    quantity: number;
    price: number;
}
export interface InvoiceData {
    from: {
        name: string;
        address: string;
        email: string;
    };
    to: {
        name: string;
        address: string;
        email: string;
    };
    items: InvoiceItem[];
    currency: string;
}
declare const CARRIERS: readonly ["UPS", "USPS", "FEDEX", "DHL"];
type Carrier = typeof CARRIERS[number];
export declare function generateInvoice(data: InvoiceData): Promise<string>;
export declare function convertToPdf(htmlPath: string, outputPath: string): Promise<string>;
export declare function sendInvoiceViaCarrier(pdfPath: string, carrier: Carrier, trackNumber?: string): Promise<any>;
export declare function validateAddress(address: string, carrier: Carrier): Promise<boolean>;
export declare function createLabel(data: {
    from: string;
    to: string;
    weight: number;
    service: string;
}, carrier: Carrier): Promise<any>;
export declare function trackShipment(carrier: Carrier, trackNumber: string): Promise<any>;
export declare function listCarriers(): Carrier[];
export {};
