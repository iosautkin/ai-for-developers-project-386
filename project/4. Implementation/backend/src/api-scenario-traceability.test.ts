import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const collectIds = (source: string, pattern: RegExp) =>
  [...source.matchAll(pattern)].map((match) => match[1]).filter((id): id is string => Boolean(id));

describe('API scenario traceability', () => {
  it('references every Gherkin API scenario exactly once from integration tests', async () => {
    const featuresDirectory = resolve(import.meta.dirname, '../../../3. Architecture/api/features');
    const featureFiles = (await readdir(featuresDirectory)).filter((file) =>
      file.endsWith('.api.feature'),
    );
    const testFiles = (await readdir(import.meta.dirname)).filter(
      (file) => file.endsWith('.api.test.ts') || file === 'health.route.test.ts',
    );
    const featureSources = await Promise.all(
      featureFiles.map((file) => readFile(resolve(featuresDirectory, file), 'utf8')),
    );
    const testSources = await Promise.all(
      testFiles.map((file) => readFile(resolve(import.meta.dirname, file), 'utf8')),
    );
    const scenarioIds = collectIds(featureSources.join('\n'), /@(API-[A-Z]+-\d{3})/g).sort();
    const referencedIds = collectIds(testSources.join('\n'), /\[(API-[A-Z]+-\d{3})\]/g).sort();

    expect(referencedIds).toHaveLength(new Set(referencedIds).size);
    expect(referencedIds).toEqual(scenarioIds);
  });
});
