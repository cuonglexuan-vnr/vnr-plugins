#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, "..");

const MARKETPLACE_NAME = "vnr-plugins";
const LOCAL_MARKETPLACE_ROOT = PACKAGE_ROOT;
const DEFAULT_PLUGIN_ID = "vnr-plugin";

function printHelp() {
  console.log(`
vnr-bootstrap

Usage:
  vnr-bootstrap init [plugin-id] [options]

Examples:
  vnr-bootstrap init
  vnr-bootstrap init vnr-plugin
  vnr-bootstrap init vnr-plugin --force
  vnr-bootstrap init vnr-plugin --scope project
  vnr-bootstrap init vnr-plugin --refresh-marketplace
  vnr-bootstrap init vnr-plugin --no-scaffold

Options:
  --scope <project|user>     Plugin install scope (default: project)
  --force                    Overwrite existing vnr-plugin folder
  --no-scaffold              Skip creating the local project folder
  --refresh-marketplace      Remove cached marketplace and re-add it
  --help                     Show this help
`);
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    stdio: "inherit",
    encoding: "utf8",
    ...options
  });
}

function tryRun(command, args, options = {}) {
  try {
    const stdout = execFileSync(command, args, {
      stdio: "pipe",
      encoding: "utf8",
      ...options
    });
    return { ok: true, stdout: stdout?.trim?.() ?? "" };
  } catch (error) {
    return {
      ok: false,
      stdout: error?.stdout?.toString?.()?.trim?.() ?? "",
      stderr: error?.stderr?.toString?.()?.trim?.() ?? "",
      error
    };
  }
}

function fail(message) {
  console.error(`✘ ${message}`);
  process.exit(1);
}

function info(message) {
  console.log(message);
}

function getFlagValue(args, flag, fallback) {
  const index = args.indexOf(flag);
  if (index === -1) return fallback;

  const value = args[index + 1];
  if (!value || value.startsWith("--")) return fallback;

  return value;
}

function hasFlag(args, flag) {
  return args.includes(flag);
}

function getPluginDirCandidates(pluginId) {
  return [pluginId, `.${pluginId}`];
}

function findFirstExisting(paths) {
  for (const p of paths) {
    if (existsSync(p)) return p;
  }
  return null;
}

function ensureClaudeInstalled() {
  const result = tryRun("claude", ["--version"]);
  if (!result.ok) {
    fail("Claude CLI was not found in PATH. Please install Claude Code first, then rerun this command.");
  }
}

function getRepoRoot() {
  const git = tryRun("git", ["rev-parse", "--show-toplevel"]);
  if (git.ok && git.stdout) {
    return git.stdout;
  }
  return process.cwd();
}

function getCachedMarketplaceRoot() {
  return join(homedir(), ".claude", "plugins", "marketplaces", MARKETPLACE_NAME);
}

function resolvePackagedPluginDir(pluginId) {
  const candidates = getPluginDirCandidates(pluginId).map((dirName) =>
    join(LOCAL_MARKETPLACE_ROOT, "plugins", dirName)
  );

  return findFirstExisting(candidates);
}

function resolveCachedPluginDir(pluginId) {
  const cacheRoot = getCachedMarketplaceRoot();
  const candidates = getPluginDirCandidates(pluginId).map((dirName) =>
    join(cacheRoot, "plugins", dirName)
  );

  return findFirstExisting(candidates);
}

function resolvePluginSourceDir(pluginId) {
  return resolveCachedPluginDir(pluginId) || resolvePackagedPluginDir(pluginId);
}

function ensurePackagedMarketplaceExists(pluginId) {
  const marketplaceManifest = join(
    LOCAL_MARKETPLACE_ROOT,
    ".claude-plugin",
    "marketplace.json"
  );

  if (!existsSync(LOCAL_MARKETPLACE_ROOT)) {
    fail(`Bundled marketplace root not found: ${LOCAL_MARKETPLACE_ROOT}`);
  }

  if (!existsSync(marketplaceManifest)) {
    fail(`Marketplace manifest not found: ${marketplaceManifest}`);
  }

  const packagedPluginDir = resolvePackagedPluginDir(pluginId);
  if (!packagedPluginDir) {
    fail(
      `Bundled plugin not found under ${join(LOCAL_MARKETPLACE_ROOT, "plugins")}. Expected one of: ${getPluginDirCandidates(pluginId).join(", ")}`
    );
  }
}

function refreshMarketplaceCacheIfNeeded(pluginId, forceRefresh) {
  const cacheRoot = getCachedMarketplaceRoot();
  const cachedPluginDir = resolveCachedPluginDir(pluginId);

  if (forceRefresh && existsSync(cacheRoot)) {
    info(`Refreshing cached marketplace: ${cacheRoot}`);
    rmSync(cacheRoot, { recursive: true, force: true });
    return;
  }

  if (existsSync(cacheRoot) && !cachedPluginDir) {
    info(`Cached marketplace looks stale. Removing: ${cacheRoot}`);
    rmSync(cacheRoot, { recursive: true, force: true });
  }
}

function addMarketplace() {
  info("Adding marketplace...");
  run("claude", ["plugin", "marketplace", "add", LOCAL_MARKETPLACE_ROOT]);
}

function installPlugin(pluginId, scope) {
  info(`Installing plugin "${pluginId}"...`);
  run("claude", ["plugin", "install", pluginId, "--scope", scope]);
}

function copyPluginToProject(sourcePluginDir, targetProjectDir, force) {
  if (existsSync(targetProjectDir)) {
    if (!force) {
      info(`Project folder already exists, skipping scaffold: ${targetProjectDir}`);
      info("Use --force if you want to overwrite it.");
      return false;
    }

    info(`Overwriting existing project folder: ${targetProjectDir}`);
    rmSync(targetProjectDir, { recursive: true, force: true });
  }

  mkdirSync(targetProjectDir, { recursive: true });

  const entries = readdirSync(sourcePluginDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === ".claude-plugin") {
      continue;
    }

    const src = join(sourcePluginDir, entry.name);
    const dest = join(targetProjectDir, entry.name);

    cpSync(src, dest, {
      recursive: true,
      force: true
    });
  }

  return true;
}

function writeInstallState(targetProjectDir, pluginId, sourcePluginDir, scope) {
  const installStatePath = join(targetProjectDir, ".install-state.json");

  writeFileSync(
    installStatePath,
    JSON.stringify(
      {
        pluginId,
        marketplace: MARKETPLACE_NAME,
        sourcePluginDir,
        scope,
        installedAtUtc: new Date().toISOString()
      },
      null,
      2
    ),
    "utf8"
  );
}

function scaffoldProject(pluginId, repoRoot, scope, force) {
  const sourcePluginDir = resolvePluginSourceDir(pluginId);

  if (!sourcePluginDir) {
    fail(`Could not resolve plugin source directory for "${pluginId}" from either the Claude cache or the bundled marketplace.`);
  }

  const targetProjectDir = join(repoRoot, pluginId);

  info(`Scaffolding project folder to: ${targetProjectDir}`);
  const copied = copyPluginToProject(sourcePluginDir, targetProjectDir, force);

  if (copied) {
    writeInstallState(targetProjectDir, pluginId, sourcePluginDir, scope);
  }
}

function main() {
  const rawArgs = process.argv.slice(2);

  if (
    rawArgs.length === 0 ||
    rawArgs.includes("--help") ||
    rawArgs.includes("-h")
  ) {
    printHelp();
    process.exit(0);
  }

  const command = rawArgs[0];
  const pluginId =
    rawArgs[1] && !rawArgs[1].startsWith("--")
      ? rawArgs[1]
      : DEFAULT_PLUGIN_ID;

  const scope = getFlagValue(rawArgs, "--scope", "project");
  const force = hasFlag(rawArgs, "--force");
  const noScaffold = hasFlag(rawArgs, "--no-scaffold");
  const refreshMarketplace = hasFlag(rawArgs, "--refresh-marketplace");

  if (command !== "init") {
    fail(`Unknown command "${command}". Use --help to see available commands.`);
  }

  if (!["project", "user"].includes(scope)) {
    fail(`Invalid scope "${scope}". Allowed values: project, user.`);
  }

  ensureClaudeInstalled();
  ensurePackagedMarketplaceExists(pluginId);

  const repoRoot = getRepoRoot();
  info(`Repository root: ${repoRoot}`);

  refreshMarketplaceCacheIfNeeded(pluginId, refreshMarketplace);
  addMarketplace();
  installPlugin(pluginId, scope);

  if (!noScaffold) {
    scaffoldProject(pluginId, repoRoot, scope, force);
  } else {
    info("Skipping project scaffold because --no-scaffold was passed.");
  }

  info("");
  info(`✔ ${pluginId} setup completed.`);
}

main();
