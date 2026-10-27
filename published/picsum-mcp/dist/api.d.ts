export declare class PicsumError extends Error {
}
export interface Photo {
    id: string;
    author: string;
    width?: number;
    height?: number;
    page?: string;
}
export declare function listPhotos(page?: number, limit?: number): Promise<Photo[]>;
export declare function getPhoto(id: string): Promise<Photo>;
export declare function photoUrl(id: string, width?: number, height?: number, grayscale?: boolean, blur?: number): string;
export declare function formatPhoto(p: Photo, index?: number): string;
