export declare class StoryblokError extends Error {
}
type Raw = Record<string, any>;
export declare function getSpace(): Promise<string>;
export interface Story {
    id: number;
    slug?: string;
    name?: string;
    published?: string;
    url?: string;
}
export declare function listStories(startsWith?: string, limit?: number): Promise<Story[]>;
export declare function getStory(slug: string): Promise<Raw>;
export declare function formatStory(s: Story, index?: number): string;
export declare function formatStoryDetail(s: Raw): string;
export {};
