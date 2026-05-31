#!/usr/bin/env node
//
// One-command setup, cross-platform. Verifies Node, installs dependencies and
// the Playwright browsers, and creates a local .env. Runs the same on macOS,
// Linux, and Windows (PowerShell, CMD, or Git Bash) because it only needs
// Node, which is already a prerequisite.

import { spawnSync } from 'node:child_process';
import { existsSync, copyFileSync } from 'node:fs';

const REQUIRED_NODE_MAJOR = 20;

/**
 * Run a shell command, streaming its output, and abort setup if it fails.
 *
 * `shell: true` lets us pass one command string and have the OS's own shell resolve
 * `npm`/`npx` (and PATH) on every platform. We exit non-zero on the first failure so a
 * broken step (e.g. `npm ci`) stops setup instead of cascading into later commands.
 */
function run(command) {
  console.log(`\n$ ${command}`);
  const result = spawnSync(command, { stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    console.error(`\nCommand failed: ${command}`);
    process.exit(result.status ?? 1);
  }
}

const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor < REQUIRED_NODE_MAJOR) {
  console.error(
    `Node ${process.versions.node} found, but Node ${REQUIRED_NODE_MAJOR}+ is required (see .nvmrc).\n` +
      `Install the LTS from https://nodejs.org, or run: nvm install ${REQUIRED_NODE_MAJOR} && nvm use`,
  );
  process.exit(1);
}
console.log(`Node ${process.versions.node} OK.`);

run('npm ci');
run('npx playwright install');

if (!existsSync('.env')) {
  copyFileSync('.env.example', '.env');
  console.log('\nCreated .env from .env.example.');
}

console.log('\nSetup complete. Run the suite with:\n  npm test');
