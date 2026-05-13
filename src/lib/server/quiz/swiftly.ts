// Resolves user-supplied Swift version specs (e.g. "6.3", "6.3.1",
// "main-snapshot") to a concrete installed toolchain version via swiftly,
// and installs the toolchain if it isn't already present. Build-time only.
//
// Uses `node:child_process` — `bun run build` ultimately invokes vite under
// Node (via its shebang), so `Bun.spawn` isn't available in the prerender
// worker. `node:` works on both runtimes.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

export type Toolchain = { version: string; installed: boolean };

type SwiftlyEntry = {
	installed?: boolean;
	version: { name: string };
};

type SwiftlyJson = { toolchains: SwiftlyEntry[] };

export function parseListAvailableJson(stdout: string): Toolchain[] {
	const parsed = JSON.parse(stdout) as SwiftlyJson;
	return parsed.toolchains.map((t) => ({
		version: t.version.name,
		installed: t.installed ?? false
	}));
}

export type SpawnResult = {
	stdout: string;
	stderr: string;
	exitCode: number;
	signal: string | null;
};

// Wrapper around execFile that resolves on any exit (including non-zero) so
// callers can branch on exit code. Throws only on spawn errors (e.g. command
// not found).
export async function spawn(
	cmd: string,
	args: string[],
	opts: { maxBuffer?: number } = {}
): Promise<SpawnResult> {
	try {
		const { stdout, stderr } = await exec(cmd, args, {
			maxBuffer: opts.maxBuffer ?? 8 * 1024 * 1024
		});
		return { stdout, stderr, exitCode: 0, signal: null };
	} catch (err) {
		// execFile rejects on non-zero exit. The error carries stdout/stderr/code.
		const e = err as Error & {
			code?: number | string;
			signal?: string | null;
			stdout?: string;
			stderr?: string;
		};
		return {
			stdout: e.stdout ?? '',
			stderr: e.stderr ?? '',
			exitCode: typeof e.code === 'number' ? e.code : 1,
			signal: e.signal ?? null
		};
	}
}

const resolved = new Map<string, Promise<string>>();

// Resolves a spec to an exact installed toolchain version, installing if
// needed. Memoized for the lifetime of the process so each spec is resolved
// at most once.
export function ensureToolchain(spec: string): Promise<string> {
	if (!resolved.has(spec)) resolved.set(spec, doResolve(spec));
	return resolved.get(spec)!;
}

async function doResolve(spec: string): Promise<string> {
	// swiftly filters server-side and returns results in newest-first order,
	// so we just take the head of the list.
	const list = await spawn('swiftly', ['list-available', '--format', 'json', spec]);
	if (list.exitCode !== 0) {
		throw new Error(
			`[swift-quiz] \`swiftly list-available ${spec}\` exited ${list.exitCode}:\n${list.stderr}`
		);
	}
	const available = parseListAvailableJson(list.stdout);
	if (available.length === 0) {
		throw new Error(
			`[swift-quiz] no Swift toolchain matches "${spec}". Run \`swiftly list-available ${spec}\` to see options.`
		);
	}
	const target = available[0];
	if (!target.installed) {
		console.log(`[swift-quiz] installing Swift ${target.version} via swiftly…`);
		const install = await spawn('swiftly', ['install', target.version, '--assume-yes'], {
			maxBuffer: 50 * 1024 * 1024
		});
		if (install.exitCode !== 0) {
			throw new Error(
				`[swift-quiz] \`swiftly install ${target.version}\` exited ${install.exitCode}:\n${install.stderr}`
			);
		}
	}
	return target.version;
}

// Test seam: forget all memoized resolutions.
export function __resetResolverForTests(): void {
	resolved.clear();
}
