export declare class DndError extends Error {
}
export interface Monster {
    index: string;
    name: string;
    size?: string;
    type?: string;
    alignment?: string;
    armor_class?: {
        value?: number;
        type?: string;
    }[];
    hit_points?: number;
    hit_dice?: string;
    speed?: Record<string, string>;
    strength?: number;
    dexterity?: number;
    constitution?: number;
    intelligence?: number;
    wisdom?: number;
    charisma?: number;
    challenge_rating?: number;
    languages?: string;
    xp?: number;
    actions?: {
        name?: string;
        desc?: string;
    }[];
    special_abilities?: {
        name?: string;
        desc?: string;
    }[];
    image?: string;
}
export interface Spell {
    index: string;
    name: string;
    level?: number;
    school?: {
        name?: string;
    };
    casting_time?: string;
    range?: string;
    components?: string[];
    duration?: string;
    ritual?: boolean;
    concentration?: boolean;
    material?: string;
    desc?: string[];
    higher_level?: string[];
}
export interface ClassInfo {
    index: string;
    name: string;
    hit_die?: number;
    proficiency_choices?: {
        from?: {
            options?: {
                item?: {
                    name?: string;
                };
            }[];
        };
    }[];
    starting_equipment?: {
        equipment?: {
            name?: string;
        };
        quantity?: number;
    }[];
}
export declare function listMonsters(limit?: number): Promise<{
    index: string;
    name: string;
}[]>;
export declare function getMonster(index: string): Promise<Monster | null>;
export declare function getSpell(index: string): Promise<Spell | null>;
export declare function getClassInfo(index: string): Promise<ClassInfo | null>;
export declare function fmtSpeed(speed?: Record<string, string>): string;
export declare function formatMonster(m: Monster): string;
export declare function formatSpell(s: Spell): string;
