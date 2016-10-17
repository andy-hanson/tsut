/**
Integer type.
Equivalent to `number`, so for documentation only.
*/
export declare type Int = number;
/**
Natural number (Int >= 0).
Equivalent to `number`, so for documentation only.
*/
export declare type Nat = number;
/** `x + 1` */
export declare function incr(x: number): number;
/** `x - 1` */
export declare function decr(x: number): number;
/** Whether a number is non-negative and a safe integer. */
export declare function isNat(num: number): boolean;
/** Asserts `Number.isSafeInteger`. */
export declare function checkInt(n: Int): void;
/** Asserts [[isNat]]. */
export declare function checkNat(n: Nat): void;
/** Whether the modulus is zero. */
export declare function divisible(numerator: Int, divisor: Nat): boolean;
/** The `+` operator as a function. */
export declare function add(a: string, b: string): string;
export declare function add(a: number, b: number): number;
/** The `-` operator as a function. */
export declare function subtract(a: number, b: number): number;
/** The `*` operator as a function. */
export declare function multiply(a: number, b: number): number;
/** The `/` operator as a function. */
export declare function divide(a: number, b: number): number;
