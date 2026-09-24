const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/calculadora.js');

// "1×200" → forma compacta de uma opção para comparar nos testes
function rotulo(opcao) {
  return opcao.itens.map((i) => `${i.quantidade}x${i.gramas}`).join('+');
}
function rotulos(resultado) {
  return resultado.opcoes.map(rotulo);
}

test('parseNumeroBR aceita vírgula, ponto e milhar', () => {
  assert.equal(C.parseNumeroBR('3,80'), 3.8);
  assert.equal(C.parseNumeroBR('3.80'), 3.8);
  assert.equal(C.parseNumeroBR('1.250'), 1250);
  assert.equal(C.parseNumeroBR('1.250,5'), 1250.5);
  assert.equal(C.parseNumeroBR(' 200 '), 200);
  assert.equal(C.parseNumeroBR('-5'), -5);
  assert.ok(Number.isNaN(C.parseNumeroBR('')));
  assert.ok(Number.isNaN(C.parseNumeroBR('abc')));
  assert.ok(Number.isNaN(C.parseNumeroBR('3,8,1')));
});

test('Exemplo por dimensões: 3,80 × 8,60 × 5,30', () => {
  const volume = C.volumePorDimensoes(3.8, 8.6, 5.3);
  assert.equal(volume, 173.2);
  const r = C.calcular(volume);
  assert.equal(r.necessidadeGramas, 138.56);
  const labels = rotulos(r);
  assert.deepEqual(labels.slice(0, 2), ['2x80', '1x200']);
  assert.equal(r.opcoes[0].excedenteGramas, 21.44);
  assert.equal(r.opcoes[0].coberturaM3, 200);
  assert.equal(r.opcoes[0].recomendada, true);
  assert.equal(r.opcoes[1].excedenteGramas, 61.44);
  assert.equal(r.opcoes[1].coberturaM3, 250);
});

test('Teste 1 — 100 m³ → 80 g → 1 × 80 g', () => {
  const r = C.calcular(100);
  assert.equal(r.necessidadeGramas, 80);
  assert.equal(rotulo(r.opcoes[0]), '1x80');
  assert.equal(r.opcoes[0].exata, true);
});

test('Teste 2 — 200 m³ → 160 g → 1 × 200 g ou 2 × 80 g', () => {
  const r = C.calcular(200);
  assert.equal(r.necessidadeGramas, 160);
  const labels = rotulos(r);
  assert.ok(labels.includes('1x200'));
  assert.ok(labels.includes('2x80'));
  assert.equal(labels[0], '2x80', 'a opção exata deve vir primeiro');
  assert.equal(r.opcoes[0].exata, true);
  assert.equal(r.opcoes[0].excedenteGramas, 0);
  assert.equal(r.opcoes.find((o) => rotulo(o) === '1x200').excedenteGramas, 40);
  assert.ok(!labels.includes('1x80'), '1 × 80 g não atende 160 g');
});

test('Teste 3 — 250 m³ → 200 g → 1 × 200 g', () => {
  const r = C.calcular(250);
  assert.equal(r.necessidadeGramas, 200);
  assert.equal(rotulo(r.opcoes[0]), '1x200');
  assert.equal(r.opcoes[0].exata, true);
});

test('Teste 4 — 500 m³ → 400 g → 1 × 400 g', () => {
  const r = C.calcular(500);
  assert.equal(r.necessidadeGramas, 400);
  assert.equal(rotulo(r.opcoes[0]), '1x400');
});

test('Teste 5 — 1.250 m³ → 1.000 g → 1 × 1.000 g', () => {
  const r = C.calcular(1250);
  assert.equal(r.necessidadeGramas, 1000);
  assert.equal(rotulo(r.opcoes[0]), '1x1000');
});

test('Teste 6 — 1.500 m³ → 1.200 g → combinação que atende', () => {
  const r = C.calcular(1500);
  assert.equal(r.necessidadeGramas, 1200);
  assert.equal(rotulo(r.opcoes[0]), '1x1000+1x200');
  assert.equal(r.opcoes[0].excedenteGramas, 0);
  assert.ok(r.opcoes.length > 1, 'deve mostrar alternativas');
});

test('Volume pequeno — 50 m³ → 40 g, menor apresentação 80 g', () => {
  const r = C.calcular(50);
  assert.equal(r.necessidadeGramas, 40, 'não altera o cálculo original');
  assert.equal(r.abaixoDaMenorApresentacao, true);
  assert.deepEqual(rotulos(r), ['1x80']);
  assert.equal(r.opcoes[0].excedenteGramas, 40);
});

test('Volume grande — 2.000 m³ → 1.600 g', () => {
  const r = C.calcular(2000);
  assert.equal(r.necessidadeGramas, 1600);
  assert.equal(rotulo(r.opcoes[0]), '1x1000+1x400+1x200');
  assert.ok(rotulos(r).includes('2x1000'));
});

test('Volume muito grande não trava e usa latas de 1.000 g', () => {
  const inicio = Date.now();
  const r = C.calcular(1_000_000); // 800.000 g
  assert.ok(Date.now() - inicio < 1000);
  assert.equal(r.necessidadeGramas, 800000);
  assert.equal(rotulo(r.opcoes[0]), '800x1000');
});

test('Invariantes para muitos volumes: nunca abaixo, ordenação correta', () => {
  for (let v = 1; v <= 5000; v += 7.37) {
    const r = C.calcular(v);
    assert.ok(r.opcoes.length >= 1, `sem opções para ${v}`);
    for (const o of r.opcoes) {
      const soma = o.itens.reduce((s, i) => s + i.quantidade * i.gramas, 0);
      assert.equal(soma, o.totalGramas);
      assert.ok(o.totalGramas >= r.necessidadeGramas, `abaixo da necessidade em ${v}`);
      assert.equal(o.latas, o.itens.reduce((s, i) => s + i.quantidade, 0));
    }
    for (let i = 1; i < r.opcoes.length; i++) {
      const a = r.opcoes[i - 1], b = r.opcoes[i];
      assert.ok(
        a.excedenteGramas < b.excedenteGramas ||
          (a.excedenteGramas === b.excedenteGramas && a.latas <= b.latas),
        `ordem incorreta em ${v}`
      );
    }
  }
});

test('Volume inválido gera erro', () => {
  assert.throws(() => C.calcular(0));
  assert.throws(() => C.calcular(-10));
  assert.throws(() => C.calcular(NaN));
});
