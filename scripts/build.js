// Gera as saídas de publicação a partir de src/:
//  - public/   → site estático publicado pela Vercel (cópia de src/)
//  - dist/calculadora-ultrad-ha.html → arquivo único com HTML, CSS e JS
//    embutidos, usado para publicar a calculadora como página (Artifact).
// As duas pastas são geradas e não são versionadas.
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const SRC = path.join(RAIZ, 'src');
const PUBLIC = path.join(RAIZ, 'public');
const DIST = path.join(RAIZ, 'dist');
const ler = (nome) => fs.readFileSync(path.join(SRC, nome), 'utf8');
const relativo = (p) => path.relative(process.cwd(), p);

// 1. Site estático (Vercel)
fs.rmSync(PUBLIC, { recursive: true, force: true });
fs.cpSync(SRC, PUBLIC, { recursive: true });
console.log(`Gerado ${relativo(PUBLIC)}/ (${fs.readdirSync(PUBLIC).join(', ')})`);

// 2. Arquivo único (Artifact)
const html = ler('index.html');
const head = html.split('<head>')[1].split('</head>')[0];
const titulo = head.match(/<title>[\s\S]*?<\/title>/)[0];
const fontes = head.match(/<link [^>]*fonts\.g[^>]*>/g).join('\n');

const corpo = html.split('<body>')[1].split('</body>')[0]
  .replace('<script src="calculadora.js"></script>', () => `<script>\n${ler('calculadora.js')}\n</script>`)
  .replace('<script src="app.js"></script>', () => `<script>\n${ler('app.js')}\n</script>`);

const pagina = `${titulo}\n${fontes}\n<style>\n${ler('styles.css')}\n</style>\n${corpo}`;

fs.mkdirSync(DIST, { recursive: true });
const destino = path.join(DIST, 'calculadora-ultrad-ha.html');
fs.writeFileSync(destino, pagina);
console.log(`Gerado ${relativo(destino)} (${pagina.length} caracteres)`);
