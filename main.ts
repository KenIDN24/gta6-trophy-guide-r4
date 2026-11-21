// Leonida Legend — hand-in program for the gta6-trophy-guide-01 entry.
// The guide itself is the static web app in app/ (open app/index.html in a
// browser; it runs fully offline). This program's only job is delivery:
// it stages app/ and screenshots/ into the output directory and writes
// dossier.json there with the vendored make.fun library, exactly the
// summary the scorer rebuilds and compares byte for byte.
//
// Run locally with an output override:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Count every file under a directory, recursively (summary only).
function countFiles(dir: string): number {
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    n += entry.isDirectory() ? countFiles(join(dir, entry.name)) : 1;
  }
  return n;
}

// Stage one directory of the entry into the output, returning how many
// files it carried (used only for the console summary below).
function stage(name: string, required: boolean): number {
  const from = join(root, name);
  if (!existsSync(from)) {
    if (required) throw new Error(`entry is missing its ${name}/ directory`);
    return 0;
  }
  cpSync(from, join(outDir, name), { recursive: true });
  return countFiles(join(outDir, name));
}

mkdirSync(outDir, { recursive: true });
const appEntries = stage('app', true);
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
const shotEntries = stage('screenshots', false);

// The caps mirror the scorer's gate: the dossier text is shaped by
// text_max_bytes, and the rest refuse a hand-in the scorer would refuse
// (over 4 screenshots or one past 256 KiB, over 993 app entries or 48 MiB).
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`staged app (${appEntries} top-level entries) + screenshots (${shotEntries}) -> ${outDir}`);
console.log(`dossier.json written (${dossier.length} bytes)`);
