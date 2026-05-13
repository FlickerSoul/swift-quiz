// On-disk cache for verification results, keyed by content hash of
// (swift spec + answer + source). Build-time only.
//
// Uses `node:` imports because SvelteKit's prerender runs in a Node worker
// (forked by `vite build` via its `#!/usr/bin/env node` shebang), even when
// the top-level invocation is `bun run build`. `node:` modules work in both
// Node and Bun, so this stays portable.

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { VerificationStatus } from '$lib/quiz/types';

const CACHE_VERSION = 1;

// Pin the cache to the repo root regardless of cwd at build time.
const repoRoot = (() => {
	// this file lives at <repo>/src/lib/server/quiz/cache.ts
	const here = dirname(fileURLToPath(import.meta.url));
	return join(here, '..', '..', '..', '..');
})();
export const CACHE_PATH = join(repoRoot, '.swift-quiz-cache.json');

export type CacheEntry = {
	result: VerificationStatus;
	recordedAt: number;
};

export type CacheFile = {
	version: number;
	entries: Record<string, CacheEntry>;
};

export function cacheKey(input: { source: string; expected: string; version: string }): string {
	return createHash('sha256')
		.update(`${input.version}\n${input.expected}\n${input.source}`)
		.digest('hex')
		.slice(0, 16);
}

export async function loadCache(path: string = CACHE_PATH): Promise<CacheFile> {
	try {
		const txt = await readFile(path, 'utf8');
		const parsed = JSON.parse(txt) as CacheFile;
		if (parsed.version !== CACHE_VERSION || typeof parsed.entries !== 'object') {
			return emptyCache();
		}
		return parsed;
	} catch {
		return emptyCache();
	}
}

export async function saveCache(cache: CacheFile, path: string = CACHE_PATH): Promise<void> {
	try {
		await mkdir(dirname(path), { recursive: true });
		await writeFile(path, JSON.stringify(cache, null, 2));
	} catch (err) {
		console.warn(`[swift-quiz] failed to write cache to ${path}: ${(err as Error).message}`);
	}
}

export function emptyCache(): CacheFile {
	return { version: CACHE_VERSION, entries: {} };
}
