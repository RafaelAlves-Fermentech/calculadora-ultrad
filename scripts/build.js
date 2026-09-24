// Gera dist/calculadora-ultrad-ha.html: um único arquivo com HTML, CSS e JS
// embutidos, usado para publicar a calculadora como página (Artifact).
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const DIST = path.join(__dirname, '..', 'dist');
const ler = (nome) => fs.readFileSync(path.join(SRC, nome), 'utf8');

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
console.log(`Gerado ${path.relative(process.cwd(), destino)} (${pagina.length} caracteres)`);
