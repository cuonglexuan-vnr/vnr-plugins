import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { buildMarketplaceZip, MARKETPLACE_ZIP_INCLUDE } from './build-marketplace-zip.mjs';

test('zips the marketplace FLAT and only the included entries', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'mkt-'));
  try {
    mkdirSync(path.join(root, '.claude-plugin'));
    writeFileSync(path.join(root, '.claude-plugin', 'marketplace.json'), '{"name":"vnr-marketplace","plugins":[]}');
    mkdirSync(path.join(root, 'plugins', 'vnr-swe'), { recursive: true });
    writeFileSync(path.join(root, 'plugins', 'vnr-swe', 'plugin.json'), '{}');
    writeFileSync(path.join(root, 'README.md'), '# x');
    mkdirSync(path.join(root, '.git'));
    writeFileSync(path.join(root, '.git', 'HEAD'), 'ref');
    writeFileSync(path.join(root, 'package.json'), '{}');

    const names = new AdmZip(buildMarketplaceZip({ rootDir: root, include: MARKETPLACE_ZIP_INCLUDE }))
      .getEntries()
      .map((e) => e.entryName.replace(/\\/g, '/'));

    assert.ok(names.includes('.claude-plugin/marketplace.json'), 'manifest at the zip root');
    assert.ok(names.includes('plugins/vnr-swe/plugin.json'));
    assert.ok(names.includes('README.md'));
    assert.ok(!names.some((n) => n.startsWith('.git/')), '.git excluded');
    assert.ok(!names.includes('package.json'), 'tooling excluded');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('refuses to build without the Claude manifest', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'mkt-'));
  try {
    assert.throws(
      () => buildMarketplaceZip({ rootDir: root, include: MARKETPLACE_ZIP_INCLUDE }),
      /marketplace\.json/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
