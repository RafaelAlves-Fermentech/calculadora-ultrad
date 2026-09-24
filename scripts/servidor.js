// Servidor local simples para abrir a calculadora em http://localhost:5173
const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', 'src');
const PORTA = Number(process.env.PORT) || 5173;
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8'
};

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const arquivo = path.join(RAIZ, url === '/' ? 'index.html' : url);
  if (!arquivo.startsWith(RAIZ)) {
    res.writeHead(403);
    return res.end('403');
  }
  fs.readFile(arquivo, (erro, dados) => {
    if (erro) {
      res.writeHead(404);
      return res.end('404');
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream' });
    res.end(dados);
  });
}).listen(PORTA, () => console.log(`Calculadora ULTRAD® HA em http://localhost:${PORTA}`));
