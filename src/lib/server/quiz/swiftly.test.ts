import { describe, expect, it } from 'vitest';
import { parseListAvailableJson } from './swiftly';

describe('parseListAvailableJson', () => {
	it('extracts version names and installed flags', () => {
		const stdout = JSON.stringify({
			toolchains: [
				{ installed: false, inUse: false, isDefault: false, version: { name: '6.3.1' } },
				{ installed: true, inUse: true, isDefault: true, version: { name: '6.3.0' } }
			]
		});
		expect(parseListAvailableJson(stdout)).toEqual([
			{ version: '6.3.1', installed: false },
			{ version: '6.3.0', installed: true }
		]);
	});

	it('handles snapshot-style version names', () => {
		const stdout = JSON.stringify({
			toolchains: [
				{
					installed: false,
					version: { name: 'main-snapshot-2024-01-15' }
				}
			]
		});
		expect(parseListAvailableJson(stdout)).toEqual([
			{ version: 'main-snapshot-2024-01-15', installed: false }
		]);
	});

	it('defaults missing installed to false', () => {
		const stdout = JSON.stringify({
			toolchains: [{ version: { name: '6.3.1' } }]
		});
		expect(parseListAvailableJson(stdout)).toEqual([{ version: '6.3.1', installed: false }]);
	});

	it('returns empty for empty toolchains', () => {
		expect(parseListAvailableJson(JSON.stringify({ toolchains: [] }))).toEqual([]);
	});
});
