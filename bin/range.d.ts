import { Nat } from "./math";
import { Seq } from "./seq";
/**
[low, high): The range including low but not including high.
Use like: `for (const i of range(0, 10)) ...`
*/
export declare function range(start: number, end: number, step?: number): Range;
/** Type returned by [[range]]. */
export declare class Range implements Iterable<number> {
    readonly start: number;
    readonly end: number;
    static nats: Range & Iterable<Nat>;
    /**
    Step taken to reach the next number.
    May be negative; must be in the direction start -> end.
    */
    readonly step: number;
    constructor(start: number, end: number, step?: number);
    [Symbol.iterator](): Iterator<number>;
    /** Wraps this in a [[Seq]]. */
    readonly seq: Seq<number>;
    /** Reverse range, e.g. 1, 2, 3 becomes 3, 2, 1. */
    readonly reverse: Range;
    /** Size of the range. Always positive. */
    readonly span: number;
    /**
    Whether a number is contained in the range [start, end].
    (That notation means: including both ends.)
    */
    spanContains(value: number): boolean;
    /** Increases or decreases a value so that the range contains it. */
    clamp(value: number): number;
}
