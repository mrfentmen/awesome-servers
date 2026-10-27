export declare class StackExchangeError extends Error {
}
export declare function searchQuestions(query: string, site?: string, limit?: number): Promise<string>;
export declare function questionsByTag(tag: string, site?: string, limit?: number): Promise<string>;
export declare function hotQuestions(site?: string, limit?: number): Promise<string>;
export declare function questionDetail(questionId: number, site?: string): Promise<string>;
export declare function answersForQuestion(questionId: number, site?: string, limit?: number): Promise<string>;
export declare function userProfile(userId: number, site?: string): Promise<string>;
