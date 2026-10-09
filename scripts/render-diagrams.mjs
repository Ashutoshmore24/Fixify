import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const diagramsDir = path.resolve(__dirname, '../docs/diagrams');
const imagesDir = path.resolve(__dirname, '../docs/images');
const configFile = path.resolve(diagramsDir, 'mermaid.config.json');
const puppeteerConfigFile = path.resolve(diagramsDir, 'puppeteer-config.json');

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const files = fs.readdirSync(diagramsDir).filter((file) => file.endsWith('.mmd'));

console.log(`Found ${files.length} diagram files in ${diagramsDir}`);

for (const file of files) {
  const baseName = path.basename(file, '.mmd');
  const inputPath = path.join(diagramsDir, file);
  const svgPath = path.join(imagesDir, `${baseName}.svg`);
  const pngPath = path.join(imagesDir, `${baseName}.png`);

  console.log(`Rendering ${file} -> SVG & PNG (scale 3, width 1600, background white)...`);

  try {
    // Render SVG
    execSync(
      `npx -y @mermaid-js/mermaid-cli -i "${inputPath}" -o "${svgPath}" -c "${configFile}" -p "${puppeteerConfigFile}" -b white`,
      { stdio: 'inherit' }
    );
    // Render PNG at scale 3 and width 1600
    execSync(
      `npx -y @mermaid-js/mermaid-cli -i "${inputPath}" -o "${pngPath}" -c "${configFile}" -p "${puppeteerConfigFile}" -b white -s 3 -w 1600`,
      { stdio: 'inherit' }
    );
    console.log(`Successfully rendered: ${baseName}`);
  } catch (err) {
    console.error(`Failed rendering ${file} with mermaid-cli:`, err.message);
  }
}

console.log('Diagram rendering script completed.');
