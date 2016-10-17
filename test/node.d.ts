declare module "assert" {
	function assert(condition: boolean, message?: string): void
	namespace assert {
		function deepStrictEqual(a: any, b: any): void
		function strictEqual(a: any, b: any): void
	}
	export = assert
}

declare module "process" {
	function hrtime(): [number, number]
}
