export declare class YoutubeError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function search(query: string, maxResults?: string): Promise<string>;
export declare function videoDetails(videoId: string): Promise<string>;
export declare function channelDetails(channelId: string): Promise<string>;
export declare function playlistItems(playlistId: string, maxResults?: string): Promise<string>;
export declare function channelPlaylists(channelId: string, maxResults?: string): Promise<string>;
export declare function mostPopular(region?: string, maxResults?: string): Promise<string>;
export declare function videoComments(videoId: string, maxResults?: string): Promise<string>;
export declare function channelVideos(channelId: string, maxResults?: string): Promise<string>;
export declare function searchChannels(query: string, maxResults?: string): Promise<string>;
export declare function liveStreams(query: string, maxResults?: string): Promise<string>;
/**
 * A channel's latest uploads, read from the Atom feed YouTube publishes at
 * /feeds/videos.xml for every channel. It costs no key and no quota, and it is the
 * only view of a channel that works for a channel with no API access at all.
 */
export declare function channelFeed(args: {
    channel_id: string;
    limit?: number;
}): Promise<string>;
/**
 * The card YouTube itself renders for any public video or playlist: title, channel
 * and its URL, and the thumbnail. This is what an embed asks for, so it works on
 * an unlisted-in-your-account video and costs no key.
 */
export declare function embedCard(args: {
    url: string;
}): Promise<string>;
