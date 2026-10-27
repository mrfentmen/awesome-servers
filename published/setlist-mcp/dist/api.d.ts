/**
 * Minimal Setlist.fm REST API v1.0 client.
 *
 * Docs: https://api.setlist.fm/docs/1.0/index.html
 * Requires a free API key (https://www.setlist.fm/settings/api) in the
 * SETLISTFM_API_KEY env var.
 */
export declare class SetlistApiError extends Error {
}
export interface Artist {
    mbid: string;
    name: string;
    disambiguation?: string;
    url: string;
}
export interface Setlist {
    id: string;
    eventDate: string;
    tour?: {
        name: string;
    };
    venue?: {
        name: string;
        city?: {
            name: string;
            country?: {
                name: string;
            };
        };
    };
    sets?: {
        set: {
            name?: string;
            song: {
                name: string;
                info?: string;
                cover?: {
                    name: string;
                };
            }[];
        }[];
    };
    url: string;
}
export interface ArtistSearchResult {
    artist: Artist;
}
export interface SetlistsResult {
    setlist: Setlist[];
    total: number;
    page: number;
    itemsPerPage: number;
}
export declare function searchArtists(name: string): Promise<ArtistSearchResult[]>;
export declare function getArtistByMbid(mbid: string): Promise<Artist>;
export declare function getSetlists(artistMbid: string, page?: number, year?: number): Promise<SetlistsResult>;
export declare function getSetlist(id: string): Promise<Setlist>;
/** Search setlists containing a specific song, used to count live plays. */
export declare function searchSetlistsBySong(artistMbid: string, songName: string, page?: number): Promise<SetlistsResult>;
export declare function formatSetlist(s: Setlist): string;
import { z } from "zod";
declare const Show: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    eventDate: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    tour: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    venue: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">>>;
    sets: z.ZodOptional<z.ZodObject<{
        set: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        set: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        set: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodOptional<z.ZodString>;
    eventDate: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    tour: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    venue: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">>>;
    sets: z.ZodOptional<z.ZodObject<{
        set: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        set: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        set: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodOptional<z.ZodString>;
    eventDate: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    tour: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    venue: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodObject<{
                name: z.ZodOptional<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodOptional<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    }, z.ZodTypeAny, "passthrough">>>;
    sets: z.ZodOptional<z.ZodObject<{
        set: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        set: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        set: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodOptional<z.ZodString>;
            song: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                info: z.ZodOptional<z.ZodString>;
                cover: z.ZodOptional<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    name: z.ZodOptional<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
            }, z.ZodTypeAny, "passthrough">>, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, z.ZodTypeAny, "passthrough">>>;
}, z.ZodTypeAny, "passthrough">>;
type ShowT = z.infer<typeof Show>;
export interface AnalyzeArgs {
    setlist: ShowT;
}
export declare function analyze_setlist(args: AnalyzeArgs): string;
export interface CompareArgs {
    before: ShowT;
    after: ShowT;
}
export declare function compare_setlists(args: CompareArgs): string;
export interface TourArgs {
    setlists: ShowT[];
}
export declare function tour_summary(args: TourArgs): string;
export {};
