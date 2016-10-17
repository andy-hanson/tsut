import { Nat } from "./math";
/**
Adds characters to the front until reaching `maxLength`.
See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
*/
export declare function padStart(str: string, maxLength: Nat, filler?: string): string;
/**
Adds characters to the end until reaching `maxLength`.
See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padEnd
*/
export declare function padEnd(str: string, maxLength: Nat, filler?: string): string;
/** Removes a known start string from the start of `str`, or throws an error. */
export declare function stripStart(start: string, str: string): string;
/** Removes a known end string from the end of `str`, or throws an error. */
export declare function stripEnd(str: string, end: string): string;
