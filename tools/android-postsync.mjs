#!/usr/bin/env node
// Runs after `cap add android` / `cap sync android` to apply the manual steps
// documented in docs/ANDROID.md, since android/ is regenerated (gitignored)
// rather than hand-maintained between builds.
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const androidDir = join(root, 'android');

if (!existsSync(androidDir)) {
  console.log('android/ not found — run `npm run android:add` first.');
  process.exit(0);
}

// 1. Notification icon: white silhouette per density, required or the status
// bar falls back to the launcher icon rendered as a white square.
const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
const iconSrcDir = join(root, 'web/icons/android');
let iconsCopied = 0;
for (const density of densities) {
  const src = join(iconSrcDir, `ic_stat_kundala-${density}.png`);
  if (!existsSync(src)) {
    console.warn(`Skipping ${density}: ${src} missing — run \`npm run icons\` first.`);
    continue;
  }
  const destDir = join(androidDir, `app/src/main/res/drawable-${density}`);
  mkdirSync(destDir, { recursive: true });
  copyFileSync(src, join(destDir, 'ic_stat_kundala.png'));
  iconsCopied++;
}
console.log(`Notification icons: copied ${iconsCopied}/${densities.length} densities.`);

// 2. Kundala makes no network calls and needs no INTERNET permission. The
// Capacitor Android template adds it unconditionally; none of the installed
// plugins re-add it via manifest merge, so deleting the app's own
// declaration is sufficient (no tools:node="remove" override needed).
const manifestPath = join(androidDir, 'app/src/main/AndroidManifest.xml');
let manifest = readFileSync(manifestPath, 'utf8');
const internetLine = /\s*<uses-permission android:name="android\.permission\.INTERNET"\s*\/>\n?/;
if (internetLine.test(manifest)) {
  manifest = manifest.replace(internetLine, '\n');
  writeFileSync(manifestPath, manifest);
  console.log('Removed unused INTERNET permission from AndroidManifest.xml.');
} else {
  console.log('INTERNET permission already absent from AndroidManifest.xml.');
}
