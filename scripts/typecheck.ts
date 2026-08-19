/**
 * Runs the project's type check and reports only the errors we can act on.
 *
 * `skipLibCheck` is deliberately **off**, because `@types/` is hand-written source rather than
 * third-party output: with it on, TypeScript silently ignores every mistake in ~4,000 lines of our
 * own declarations. Turning it off is what makes the type check a real gate over that tree.
 *
 * The cost is that dependencies' own declaration files get checked too, and one of them does not
 * type-check against the TypeScript version pinned here — `@sapphire/shapeshift`, reached
 * transitively through `discord.js` → `@discordjs/builders`, imports `InspectOptionsStylized` from
 * `util`, which newer Node typings no longer export. It is not our code and not ours to fix, so
 * errors originating inside `node_modules/` are listed separately and do not fail the run.
 */
const proc = Bun.spawn(["bunx", "tsc", "--noEmit", "--pretty", "false"], {
	stdout: "pipe",
	stderr: "pipe",
});

const [stdout, stderr] = await Promise.all([
	new Response(proc.stdout).text(),
	new Response(proc.stderr).text(),
]);
await proc.exited;

const lines = `${stdout}${stderr}`
	.split("\n")
	.filter((line) => line.includes("error TS"));
const ours = lines.filter(
	(line) => !line.includes("node_modules/") && !line.includes("node_modules\\"),
);
const theirs = lines.length - ours.length;

for (const line of ours) console.log(line);

if (theirs > 0) {
	console.log(
		`\n${theirs} error(s) inside node_modules/ ignored — third-party declarations, not ours.`,
	);
}

if (ours.length === 0) {
	console.log("\nType check clean: 0 errors in src/, @types/ and tests/.");
	process.exit(0);
}

console.log(`\nType check failed: ${ours.length} error(s).`);
process.exit(1);
