/**
 * Dựng zip marketplace để phân phối: PHẲNG (các mục nằm ở gốc zip, để
 * DevHub giải nén thẳng vào thư mục marketplace của nó) và theo allow-list
 * (chỉ những gì Claude Code cần — không bao giờ có .git, tooling hay ngữ cảnh phiên làm việc).
 */
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';

/** Các mục phát cho người dùng. Mọi thứ còn lại trong repo là tooling soạn thảo. */
export const MARKETPLACE_ZIP_INCLUDE = ['.claude-plugin', 'plugins', 'README.md'];

/** Vị trí manifest của Claude Code — DevHub từ chối zip không có nó. */
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
