import type { SceneBreakdown, SceneNode, ScreenplayAST } from "./types.js";
export declare function parseFountain(text: string): ScreenplayAST;
export declare function astToFountain(ast: ScreenplayAST): string;
export declare function sceneToFountain(scene: SceneNode): string;
export declare function getSceneBreakdown(ast: ScreenplayAST): SceneBreakdown[];
export declare function estimateRuntime(ast: ScreenplayAST): {
    pages: number;
    minutes: number;
    scenes: number;
};
