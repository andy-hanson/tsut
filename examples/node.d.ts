declare module "fs" {
	export function readdir(path: string, callback?: (err: Error, files: string[]) => void): void
	export function readFile(filename: string, encoding: string, callback: (err: Error, data: string) => void): void
	export function stat(path: string, callback?: (err: Error, stats: Stats) => any): void
	interface Stats {
		isFile(): boolean
		isDirectory(): boolean
	}
}

declare module "path" {
	export function join(...paths: string[]): string
}
