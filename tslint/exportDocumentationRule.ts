import * as Lint from "tslint/lib/lint"
import * as ts from "typescript"

/** Rule wrapper. */
export class Rule extends Lint.Rules.AbstractRule {
	static metadata: Lint.IRuleMetadata = {
		ruleName: "export-documentation",
		description: "Requires that all exports be documented",
		rationale: "Library users expect its exports to be documented",
		options: {},
		type: "maintainability"
	}

	static FAILURE_STRING = "Export must have a JSDoc comment"

	apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
		return this.applyWithWalker(new MyWalker(sourceFile, this.getOptions()))
	}
}

/** Visitor that checks an individual node for documentation. */
class MyWalker extends Lint.RuleWalker {
	visitSourceFile(node: ts.SourceFile): void {
		this.checkStatements(node.statements)
		super.visitSourceFile(node)
	}

	visitModuleDeclaration(node: ts.ModuleDeclaration): void {
		if (node.body && node.body.kind === ts.SyntaxKind.ModuleBlock)
			this.checkStatements((node.body as ts.ModuleBlock).statements)
		super.visitModuleDeclaration(node)
	}

	visitClassDeclaration(node: ts.ClassDeclaration): void {
		if (isExported(node))
			for (const member of node.members)
				this.checkPublic(member)
		super.visitClassDeclaration(node)
	}

	visitInterfaceDeclaration(node: ts.InterfaceDeclaration): void {
		if (isExported(node))
			for (const member of node.members)
				this.checkPublic(member)
		super.visitInterfaceDeclaration(node)
	}

	visitEnumDeclaration(node: ts.EnumDeclaration): void {
		if (isExported(node))
			for (const member of node.members)
				this.checkDocumented(member)
		super.visitEnumDeclaration(node)
	}

	private checkStatements(statements: ts.Statement[]): void {
		let lastFunctionName: string | undefined

		for (let i = 0; i < statements.length; i++) {
			const statement = statements[i]
			if (statement.kind === ts.SyntaxKind.FunctionDeclaration) {
				const fn = statement as ts.FunctionDeclaration
				const fnName = functionName(fn)
				if (lastFunctionName !== fnName)
					this.checkExport(fn)
				lastFunctionName = fnName
			} else {
				this.checkExport(statement)
				lastFunctionName = undefined
			}
		}
	}

	private checkExport(node: ts.Node): void {
		if (isExported(node))
			this.checkDocumented(node)
	}

	private checkPublic(node: ts.Node): void {
		if (isPublic(node))
			this.checkDocumented(node)
	}

	private checkDocumented(node: ts.Node): void {
		if (!isDocumented(node))
			this.fail(node)
	}

	private fail(node: ts.Node): void {
		this.addFailure(this.createFailure(node.getStart(), node.getWidth(), Rule.FAILURE_STRING))
	}
}

function isExported(_node: ts.Node): boolean {
	return false
	// TODO: TypeScript 2.0.5 provides this
	// return !!(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export)
}

function isPublic(_node: ts.Node): boolean {
	return false
	// return !!(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Public)
}

function isDocumented(_node: ts.Node): boolean {
	return true
	// TODO: TypeScript 2.0.5 provides this
	// return node.jsDocComments !== undefined
}

function functionName(node: ts.FunctionDeclaration): string | undefined {
	return node.name === undefined ? undefined : node.name.text
}
