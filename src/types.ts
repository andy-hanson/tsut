/** Whether it is a primitive boolean. */
export function isBoolean(x: any): x is boolean {
	return typeof x === "boolean"
}

/** Whether it is a primitive number. */
export function isNumber(x: any): x is number {
	return typeof x === "number"
}

/** Whether it is a primitive string. */
export function isString(x: any): x is string {
	return typeof x === "string"
}

/** Whether it is a symbol. */
export function isSymbol(x: any): x is symbol {
	return typeof x === "symbol"
}

/** Whether it is a function. */
export function isFunction(x: any): x is Function { // tslint:disable-line ban-types
	return typeof x === "function"
}

/**
Whether it is not a primitive and not a function.
Note that this does *not* include `null`.
*/
export function isObject(x: any): boolean {
	return typeof x === "object" && x !== null
}
