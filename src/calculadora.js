/*
 * Lógica de cálculo da Calculadora ULTRAD® HA.
 *
 * Separada da interface para poder ser testada em Node (npm test)
 * e usada no navegador (window.UltradCalc).
 *
 * Internamente todas as quantidades são inteiras em CENTÉSIMOS
 * (centésimos de m³ e centésimos de grama) para evitar erros de
 * ponto flutuante nas comparações "atende / não atende".
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.UltradCalc = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Regra comercial: 1 m³ = 0,8 g de ULTRAD® HA
  var DOSAGEM_G_POR_M3 = 0.8;

  // Apresentações disponíveis (g), da maior para a menor
  var APRESENTACOES = [1000, 400, 200, 80];
  var MENOR_APRESENTACAO = 80;

  // Quantas opções no máximo exibir e quanto "afrouxar" a busca
  var MAX_OPCOES = 5;
  var LATAS_EXTRAS_ALTERNATIVAS_EXATAS = 2;

  /**
   * Converte texto digitado pelo usuário (padrão brasileiro) em número.
   * Aceita "3,80", "3.80", "1.250", "1.250,5", " 200 m³ ".
   * Retorna NaN se não for um número válido.
   */
  function parseNumeroBR(texto) {
    if (typeof texto === 'number') return texto;
    if (texto == null) return NaN;
    var s = String(texto).trim().replace(/\s+/g, '').replace(/m[²³23]?$/i, '');
    if (s === '') return NaN;

    var temVirgula = s.indexOf(',') !== -1;
    var temPonto = s.indexOf('.') !== -1;

    if (temVirgula && temPonto) {
      // "1.250,50" → ponto é milhar, vírgula é decimal
      s = s.replace(/\./g, '').replace(',', '.');
    } else if (temVirgula) {
      s = s.replace(',', '.');
    } else if (temPonto && /^-?\d{1,3}(\.\d{3})+$/.test(s)) {
      // "1.250" ou "12.500" → separador de milhar
      s = s.replace(/\./g, '');
    }

    if (!/^-?\d+(\.\d+)?$/.test(s) && !/^-?\.\d+$/.test(s)) return NaN;
    return parseFloat(s);
  }

  function arredondar2(n) {
    return Math.round(n * 100) / 100;
  }

  function volumePorDimensoes(altura, comprimento, largura) {
    return arredondar2(altura * comprimento * largura);
  }

  function necessidadeGramas(volumeM3) {
    return arredondar2(arredondar2(volumeM3) * DOSAGEM_G_POR_M3);
  }

  function coberturaM3(gramas) {
    return arredondar2(gramas / DOSAGEM_G_POR_M3);
  }

  /**
   * Gera todas as combinações "mínimas" de latas que atendem (>=) a necessidade.
   * Mínima = não é possível retirar nenhuma lata e continuar atendendo.
   * Para volumes grandes, o número de latas de 1.000 g é limitado a uma
   * faixa próxima da necessidade (as demais combinações são irrelevantes).
   */
  function gerarCombinacoes(necessidade100) {
    if (!(necessidade100 > 0)) return [];

    var t1000 = 100000, t400 = 40000, t200 = 20000, t80 = 8000;
    var maxA = Math.ceil(necessidade100 / t1000);
    var minA = Math.max(0, Math.floor(necessidade100 / t1000) - 2);
    var vistas = {};
    var combos = [];

    for (var a = minA; a <= maxA; a++) {
      var r1 = necessidade100 - a * t1000;
      var maxB = Math.max(0, Math.ceil(r1 / t400));
      for (var b = 0; b <= maxB; b++) {
        var r2 = r1 - b * t400;
        var maxC = Math.max(0, Math.ceil(r2 / t200));
        for (var c = 0; c <= maxC; c++) {
          var r3 = r2 - c * t200;
          var d = Math.max(0, Math.ceil(r3 / t80));
          var qtd = [a, b, c, d];
          var total100 = a * t1000 + b * t400 + c * t200 + d * t80;
          if (total100 < necessidade100) continue;

          // Mínima: retirar qualquer lata deixa abaixo da necessidade
          var minima = true;
          var tamanhos = [t1000, t400, t200, t80];
          for (var i = 0; i < 4; i++) {
            if (qtd[i] > 0 && total100 - tamanhos[i] >= necessidade100) {
              minima = false;
              break;
            }
          }
          if (!minima) continue;

          var chave = qtd.join('-');
          if (vistas[chave]) continue;
          vistas[chave] = true;
          combos.push({ qtd: qtd, total100: total100, latas: a + b + c + d });
        }
      }
    }
    return combos;
  }

  function comparar(x, y) {
    return (x.excedente100 - y.excedente100) || (x.latas - y.latas);
  }

  /**
   * Seleciona as opções comercialmente relevantes:
   *  - todas as combinações não dominadas (nenhuma outra tem excedente
   *    menor/igual E número de latas menor/igual);
   *  - alternativas que também atingem o menor excedente possível,
   *    desde que não usem muito mais latas que a melhor opção.
   * Ordem: menor excedente → menor número de latas.
   */
  function selecionarOpcoes(necessidade100, combos) {
    combos.forEach(function (c) { c.excedente100 = c.total100 - necessidade100; });
    combos.sort(comparar);
    if (combos.length === 0) return [];

    var naoDominadas = combos.filter(function (c) {
      return !combos.some(function (o) {
        return o !== c &&
          o.excedente100 <= c.excedente100 && o.latas <= c.latas &&
          (o.excedente100 < c.excedente100 || o.latas < c.latas);
      });
    });

    var melhor = combos[0];
    var escolhidas = naoDominadas.slice();
    combos.forEach(function (c) {
      if (escolhidas.length >= MAX_OPCOES) return;
      if (escolhidas.indexOf(c) !== -1) return;
      if (c.excedente100 === melhor.excedente100 &&
          c.latas <= melhor.latas + LATAS_EXTRAS_ALTERNATIVAS_EXATAS) {
        escolhidas.push(c);
      }
    });

    return escolhidas.sort(comparar).slice(0, Math.max(MAX_OPCOES, naoDominadas.length));
  }

  function formatarOpcao(c, indice) {
    var itens = [];
    for (var i = 0; i < APRESENTACOES.length; i++) {
      if (c.qtd[i] > 0) itens.push({ quantidade: c.qtd[i], gramas: APRESENTACOES[i] });
    }
    var total = c.total100 / 100;
    return {
      indice: indice + 1,
      itens: itens,
      latas: c.latas,
      totalGramas: total,
      excedenteGramas: c.excedente100 / 100,
      coberturaM3: coberturaM3(total),
      exata: c.excedente100 === 0,
      recomendada: indice === 0
    };
  }

  /**
   * Cálculo completo a partir do volume (m³).
   */
  function calcular(volumeM3) {
    if (typeof volumeM3 !== 'number' || !isFinite(volumeM3) || volumeM3 <= 0) {
      throw new Error('Volume inválido');
    }
    var volume = arredondar2(volumeM3);
    var necessidade = necessidadeGramas(volume);
    // Volumes muito pequenos podem arredondar a necessidade para 0,00 g;
    // ainda assim o ambiente precisa de ao menos 1 lata.
    var necessidade100 = Math.max(1, Math.round(necessidade * 100));
    var opcoes = selecionarOpcoes(necessidade100, gerarCombinacoes(necessidade100))
      .map(formatarOpcao);

    return {
      volumeM3: volume,
      necessidadeGramas: necessidade,
      dosagem: DOSAGEM_G_POR_M3,
      abaixoDaMenorApresentacao: necessidade < MENOR_APRESENTACAO,
      menorApresentacao: MENOR_APRESENTACAO,
      opcoes: opcoes
    };
  }

  return {
    DOSAGEM_G_POR_M3: DOSAGEM_G_POR_M3,
    APRESENTACOES: APRESENTACOES,
    MENOR_APRESENTACAO: MENOR_APRESENTACAO,
    parseNumeroBR: parseNumeroBR,
    volumePorDimensoes: volumePorDimensoes,
    necessidadeGramas: necessidadeGramas,
    coberturaM3: coberturaM3,
    gerarCombinacoes: gerarCombinacoes,
    calcular: calcular
  };
});
