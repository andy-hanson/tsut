import { Fn1 } from "./function";
/** First element of a tuple. */
export declare function _1st<T>(tuple: [T, any] | [T, any, any] | [T, any, any, any]): T;
/** Second element of a tuple. */
export declare function _2nd<T>(tuple: [any, T] | [any, T, any] | [any, T, any, any]): T;
/** Third element of a tuple. */
export declare function _3rd<T>(tuple: [any, any, T] | [any, any, T, any]): T;
/** Fourth element of a tuple. */
export declare function _4th<T>(tuple: [any, any, any, T]): T;
/** Applies a function to the first element of a tuple and returns the new tuple. */
export declare function mod1st<T1, T2, U>(tuple: [T1, U], f: Fn1<T1, T2>): [T2, U];
export declare function mod1st<T1, T2, U, V>(tuple: [T1, U, V], f: Fn1<T1, T2>): [T2, U, V];
export declare function mod1st<T1, T2, U, V, W>(tuple: [T1, U, V, W], f: Fn1<T1, T2>): [T2, U, V, W];
/** Applies a function to the first element of a tuple and returns the new tuple. */
export declare function mod2nd<T1, T2, U>(tuple: [U, T1], f: Fn1<T1, T2>): [U, T2];
export declare function mod2nd<T1, T2, U, V>(tuple: [U, T1, V], f: Fn1<T1, T2>): [U, T2, V];
export declare function mod2nd<T1, T2, U, V, W>(tuple: [U, T1, V, W], f: Fn1<T1, T2>): [U, T2, V, W];
/** Applies a function to the third element of a tuple and returns the new tuple. */
export declare function mod3rd<T1, T2, U, V>(tuple: [U, V, T1], f: Fn1<T1, T2>): [U, V, T2];
export declare function mod3rd<T1, T2, U, V, W>(tuple: [U, V, T2, W], f: Fn1<T1, T2>): [U, V, T2, W];
/** Applies a function to the third element of a tuple and returns the new tuple. */
export declare function mod4th<T1, T2, U, V, W>(tuple: [U, V, W, T1], f: Fn1<T1, T2>): [U, V, W, T2];
