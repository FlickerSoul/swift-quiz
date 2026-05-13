import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cacheKey, emptyCache, loadCache, saveCache } from './cache';

let dir: string;
let path: string;

beforeEach(async () => {
	dir = await mkdtemp(join(tmpdir(), 'swift-quiz-cache-test-'));
	path = join(dir, 'cache.json');
});

afterEach(async () => {
	await rm(dir, { recursive: true, force: true });
});

describe('cacheKey', () => {
	it('is stable for the same input', () => {
		const a = cacheKey({ source: 'print(1)', expected: '{"kind":"prints"}', version: '6.3.0' });
		const b = cacheKey({ source: 'print(1)', expected: '{"kind":"prints"}', version: '6.3.0' });
		expect(a).toBe(b);
	});

	it('differs when any input changes', () => {
		const base = { source: 'print(1)', expected: '{"kind":"prints"}', version: '6.3.0' };
		const k = cacheKey(base);
		expect(cacheKey({ ...base, source: 'print(2)' })).not.toBe(k);
		expect(cacheKey({ ...base, expected: '{"kind":"trap"}' })).not.toBe(k);
		expect(cacheKey({ ...base, version: '6.3.1' })).not.toBe(k);
	});
});

describe('loadCache/saveCache', () => {
	it('returns empty when file is absent', async () => {
		expect(await loadCache(path)).toEqual(emptyCache());
	});

	it('round-trips entries', async () => {
		const cache = emptyCache();
		cache.entries['abc'] = {
			result: { kind: 'verified', version: '6.3.0' },
			recordedAt: 1
		};
		await saveCache(cache, path);
		const reloaded = await loadCache(path);
		expect(reloaded.entries['abc']).toEqual({
			result: { kind: 'verified', version: '6.3.0' },
			recordedAt: 1
		});
	});

	it('treats payloads from other cache versions as empty', async () => {
		const stale = {
			version: 999,
			entries: { abc: { result: { kind: 'verified' }, recordedAt: 0 } }
		};
		const { writeFile } = await import('node:fs/promises');
		await writeFile(path, JSON.stringify(stale));
		expect(await loadCache(path)).toEqual(emptyCache());
	});

	it('treats malformed JSON as empty', async () => {
		const { writeFile } = await import('node:fs/promises');
		await writeFile(path, 'not-json');
		expect(await loadCache(path)).toEqual(emptyCache());
	});
});
