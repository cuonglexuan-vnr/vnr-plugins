#!/usr/bin/env node
/**
 * Publish zip marketplace lên registry artifact của VNR (Artifact Keeper,
 * repo generic). Chạy được trên Windows và Linux. Cấu hình chỉ qua biến môi trường
 * (`task publish` nạp chúng từ `.env` ở gốc repo — xem `Taskfile.yml`, `.env.example`):
 *   AK_TOKEN       (bắt buộc) — API token của registry có quyền repository:write
 *   AK_REPO_BASE   (tuỳ chọn) — mặc định https://sa-hrm.vnrlocal.com:9091/api/v1/repositories/vnr-marketplace
 *   AK_ARTIFACT    (tuỳ chọn) — mặc định marketplace.zip
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMarketplaceZip, MARKETPLACE_ZIP_INCLUDE, MANIFEST_RELATIVE_PATH } from './build-marketplace-zip.mjs';

const DEFAULT_REPO_BASE = 'https://sa-hrm.vnrlocal.com:9091/api/v1/repositories/vnr-marketplace';
const DEFAULT_ARTIFACT = 'marketplace.zip';
const UPLOAD_TIMEOUT_MS = 120_000;

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const token = process.env.AK_TOKEN;
const repoBase = (process.env.AK_REPO_BASE ?? DEFAULT_REPO_BASE).replace(/\/+$/, '');
const artifact = process.env.AK_ARTIFACT ?? DEFAULT_ARTIFACT;

if (!token) {
  console.error('AK_TOKEN is required (registry API token with repository:write).');
  process.exit(2);
}

const { version = '0.0.0' } = JSON.parse(readFileSync(path.join(rootDir, MANIFEST_RELATIVE_PATH), 'utf8'));
const body = buildMarketplaceZip({ rootDir, include: MARKETPLACE_ZIP_INCLUDE });

console.log(`Uploading ${artifact} (${body.length} bytes, marketplace v${version}) -> ${repoBase}`);
const res = await fetch(`${repoBase}/artifacts/${artifact}`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/zip',
    'X-Artifact-Version': version,
  },
  body,
  signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
});
const text = await res.text();
if (!res.ok) {
  console.error(`Upload failed: HTTP ${res.status}\n${text}`);
  process.exit(1);
}
let checksum = '';
try {
  checksum = JSON.parse(text).checksum_sha256 ?? '';
} catch {
  /* nội dung phản hồi chỉ mang tính thông tin */
}
console.log(`Published. Anonymous download: ${repoBase}/download/${artifact}`);
if (checksum) console.log(`sha256: ${checksum}`);
