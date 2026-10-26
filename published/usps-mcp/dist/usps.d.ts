export declare function getRate(data: {
    destination: string;
    weight: number;
    service?: string;
}): Promise<any>;
export declare function createLabel(data: {
    from: {
        street: string;
        city: string;
        state: string;
        zip: string;
    };
    to: {
        street: string;
        city: string;
        state: string;
        zip: string;
    };
    weight: number;
    service?: string;
}): Promise<any>;
export declare function trackPackage(trackingNumber: string): Promise<any>;
export declare function validateAddress(address: {
    street: string;
    city: string;
    state: string;
    zip: string;
}): Promise<any>;
export declare function getZipCode(address: {
    city: string;
    state: string;
}): Promise<any>;
export declare function getAddressInfo(zip: string): Promise<any>;
export declare function schedulePickup(data: {
    address: {
        street: string;
        city: string;
        state: string;
        zip: string;
    };
    packageCount: number;
}): Promise<any>;
export declare function getServiceStandards(originZip: string, destZip: string): Promise<any>;
