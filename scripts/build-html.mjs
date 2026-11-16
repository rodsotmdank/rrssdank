// Convierte legacy/calendario.html en un módulo JS (lib/appHtml.js) para servirlo desde la ruta protegida.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'legacy', 'calendario.html'), 'utf8');
mkdirSync(join(root, 'lib'), { recursive: true });
writeFileSync(join(root, 'lib', 'appHtml.js'), 'export default ' + JSON.stringify(html) + ';\n');
console.log('appHtml.js generado (' + Math.round(html.length / 1024) + ' KB)');
