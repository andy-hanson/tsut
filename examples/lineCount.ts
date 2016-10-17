/// <reference path="node.d.ts" />
import * as fs from "fs"
import * as path from "path"

import { AsyncSeq, Nat, Seq, asyncSeq, callback, eq, padEnd, promisify, stripStart } from "../src/index"

type Counts = Seq<{ file: string, count: Nat }>

function fileCounts(dirPath: string): Promise<Counts> {
	return readdirRecursive(dirPath)
		.map(async filename =>
			({ file: stripStart(dirPath, filename), count: await lineCount(filename) }))
		.eager()
}

function lineCount(filename: string): Promise<Nat> {
	return asyncSeq(readTextFile(filename)).filter(eq("\n")).count()
}

function readdirRecursive(dirPath: string): AsyncSeq<string> {
	return asyncSeq(readdir(dirPath)).par.flatMap(async filePath => {
		const fullPath = path.join(dirPath, filePath)
		const stats = await stat(fullPath)
		return stats.isDirectory()
			? readdirRecursive(fullPath)
			: stats.isFile()
			? [ fullPath ]
			: undefined
	})
}

const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)
function readTextFile(name: string): Promise<string> {
	return callback(cb => fs.readFile(name, "utf-8", cb))
}

function printCounts(dirName: string, counts: Counts): void {
	console.log(`# ${dirName}\n`)
	const padLength = counts.map(({ file }) => file.length).max()!
	for (const { file, count } of counts)
		console.log(padEnd(file, padLength), count)
	console.log(`${padEnd("Total", padLength)} ${counts.map(_ => _.count).sum()}\n`)
}

AsyncSeq.of("examples", "src", "test")
	.par.map(async dir => ({ dir, counts: await fileCounts(dir) }))
	.each(({ dir, counts }) => printCounts(dir, counts))
	.catch(console.error)
