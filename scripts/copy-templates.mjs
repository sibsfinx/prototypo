#!/usr/bin/env node
import { mkdirSync, copyFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const templates = [
  { name: 'john-fell.ptf', src: 'john-fell.ptf' },
  { name: 'venus.ptf', src: 'venus.ptf' },
  { name: 'elzevir.ptf', src: 'elzevir.ptf' },
  { name: 'gfnt.ptf', src: 'gfnt.ptf' },
  { name: 'antique.ptf', src: 'antique.ptf' },
];

// Create dist/templates directory
const templatesDir = join(root, 'dist', 'templates');
mkdirSync(templatesDir, { recursive: true });

// Copy each template
for (const template of templates) {
  const srcPath = join(root, 'node_modules', template.src, 'dist', 'font.json');
  const destDir = join(templatesDir, template.name);
  const destPath = join(destDir, 'font.json');

  if (existsSync(srcPath)) {
    mkdirSync(destDir, { recursive: true });
    copyFileSync(srcPath, destPath);
    console.log(`✓ Copied ${template.name}/font.json`);
  } else {
    console.warn(`⚠ Warning: ${srcPath} not found`);
  }
}

console.log('Template files copied successfully!');
