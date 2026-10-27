export declare class LibriVoxError extends Error {
}
export interface Author {
    first_name?: string;
    last_name?: string;
    dob?: string;
    dod?: string;
}
export interface Section {
    section_number?: string;
    title?: string;
    listen_url?: string;
    playtime?: string;
    readers?: Array<{
        display_name?: string;
    }>;
}
export interface Book {
    id?: string;
    title?: string;
    description?: string;
    language?: string;
    copyright_year?: string;
    num_sections?: string;
    totaltime?: string;
    url_librivox?: string;
    url_zip_file?: string;
    url_rss?: string;
    url_text_source?: string;
    url_iarchive?: string;
    authors?: Author[];
    sections?: Section[];
}
export declare function authorName(a: Author): string;
export declare function bookLine(b: Book): string;
export declare function searchByTitle(title: string, limit: number): Promise<Book[]>;
export declare function searchByAuthor(author: string, limit: number): Promise<Book[]>;
export declare function detail(id: number): Promise<Book | undefined>;
export declare function browse(limit: number, offset: number): Promise<Book[]>;
export declare function detailText(b: Book): string;
export declare function sectionsText(b: Book, limit: number): string;
export declare function linksText(b: Book): string;
