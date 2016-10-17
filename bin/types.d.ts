/** Whether it is a primitive boolean. */
export declare function isBoolean(x: any): x is boolean;
/** Whether it is a primitive number. */
export declare function isNumber(x: any): x is number;
/** Whether it is a primitive string. */
export declare function isString(x: any): x is string;
/** Whether it is a symbol. */
export declare function isSymbol(x: any): x is symbol;
/** Whether it is a function. */
export declare function isFunction(x: any): x is Function;
/**
Whether it is not a primitive and not a function.
Note that this does *not* include `null`.
*/
export declare function isObject(x: any): boolean;
