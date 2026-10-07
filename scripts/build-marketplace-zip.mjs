/**
 * Builds the distributable marketplace zip: FLAT (entries at the zip root, so
 * DevHub can extract it straight into its marketplace folder) and allow-listed
 * (only what Claude Code needs — never .git, tooling or session context).
 */
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';

/** Entries shipped to users. Everything else in the repo is authoring tooling. */
export const MARKETPLACE_ZIP_INCLUDE = ['.claude-plugin', 'plugins', 'README.md'];

/** Claude Code's manifest location — DevHub rejects a zip without it. */
export const MANIFEST_RELATIVE_PATH = path.join('.claude-plugin', 'marketplace.json');

export function buildMarketplaceZip({ rootDir, include }) {
  if (!existsSync(path.join(rootDir, MANIFEST_RELATIVE_PATH))) {
    throw new Error(`Missing ${MANIFEST_RELATIVE_PATH} in ${rootDir} — not a Claude Code marketplace.`);
  }
  const zip = new AdmZip();
  for (const entry of include) {
    const abs = path.join(rootDir, entry);
    if (!existsSync(abs)) continue;
    if (statSync(abs).isDirectory()) zip.addLocalFolder(abs, entry);
    else zip.addLocalFile(abs);
  }
  return zip.toBuffer();
}
