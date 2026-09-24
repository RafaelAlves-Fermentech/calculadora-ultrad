(function () {
  'use strict';

  var C = window.UltradCalc;
  var modo = 'dimensoes';

  var $ = function (id) { return document.getElementById(id); };
  var form = $('form');
  var erro = $('erro');
  var resultado = $('resultado');

  // Números no padrão brasileiro: "173,20", "1.250", "200"
  function fmt(n) {
    var inteiro = Math.abs(n - Math.round(n)) < 1e-9;
    return n.toLocaleString('pt-BR', {
      minimumFractionDigits: inteiro ? 0 : 2,
      maximumFractionDigits: inteiro ? 0 : 2
    });
  }
  function fmt2(n) {
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function trocarModo(novo) {
    modo = novo;
    document.querySelectorAll('.modo-btn').forEach(function (b) {
      var ativo = b.dataset.modo === novo;
      b.classList.toggle('ativo', ativo);
      b.setAttribute('aria-selected', ativo);
    });
    $('campos-dimensoes').hidden = novo !== 'dimensoes';
    $('campos-volume').hidden = novo !== 'volume';
    limparErro();
    resultado.hidden = true;
    var primeiro = novo === 'dimensoes' ? $('altura') : $('volume');
    primeiro.focus();
  }

  function mostrarErro(msg, campos) {
    erro.textContent = msg;
    erro.hidden = false;
    campos.forEach(function (c) { c.classList.add('invalido'); });
    if (campos[0]) campos[0].focus();
    resultado.hidden = true;
  }
  function limparErro() {
    erro.hidden = true;
    document.querySelectorAll('.invalido').forEach(function (c) { c.classList.remove('invalido'); });
  }

  // Lê e valida os campos; retorna o número ou registra o problema
  function lerCampos(ids) {
    var valores = [], vazios = [], invalidos = [], negativos = [];
    ids.forEach(function (id) {
      var el = $(id);
      var texto = el.value.trim();
      if (texto === '') { vazios.push(el); return; }
      var n = C.parseNumeroBR(texto);
      if (isNaN(n)) invalidos.push(el);
      else if (n < 0) negativos.push(el);
      else if (n === 0) invalidos.push(el);
      valores.push(n);
    });
    if (vazios.length) return { erro: 'Preencha todos os campos.', campos: vazios };
    if (negativos.length) return { erro: 'Não são permitidos valores negativos.', campos: negativos };
    if (invalidos.length) return { erro: 'Informe um número maior que zero (ex.: 3,80).', campos: invalidos };
    return { valores: valores };
  }

  function calcular(ev) {
    ev.preventDefault();
    limparErro();

    var volume, detalhe;
    if (modo === 'dimensoes') {
      var r = lerCampos(['altura', 'comprimento', 'largura']);
      if (r.erro) return mostrarErro(r.erro, r.campos);
      volume = C.volumePorDimensoes(r.valores[0], r.valores[1], r.valores[2]);
      detalhe = fmt2(r.valores[0]) + ' × ' + fmt2(r.valores[1]) + ' × ' + fmt2(r.valores[2]) + ' m';
      if (volume <= 0) return mostrarErro('As dimensões resultam em volume zero.', [$('altura')]);
    } else {
      var rv = lerCampos(['volume']);
      if (rv.erro) return mostrarErro(rv.erro, rv.campos);
      volume = rv.valores[0];
      detalhe = 'Informado diretamente';
    }

    render(C.calcular(volume), detalhe);
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function render(r, detalhe) {
    $('r-volume').textContent = fmt(r.volumeM3) + ' m³';
    $('r-volume-detalhe').textContent = detalhe;
    $('r-necessidade').textContent = fmt(r.necessidadeGramas) + ' g';

    var aviso = $('r-aviso');
    if (r.abaixoDaMenorApresentacao) {
      aviso.innerHTML = 'A necessidade calculada (<strong>' + fmt(r.necessidadeGramas) +
        ' g</strong>) é inferior à menor apresentação disponível: <strong>' +
        r.menorApresentacao + ' g</strong>.';
      aviso.hidden = false;
    } else {
      aviso.hidden = true;
    }

    var lista = $('r-opcoes');
    lista.innerHTML = '';
    r.opcoes.forEach(function (o) {
      var card = el('article', 'opcao' + (o.recomendada ? ' recomendada' : ''));

      var topo = el('div', 'opcao-topo');
      topo.appendChild(el('span', 'opcao-num', 'Opção ' + o.indice));
      var selos = el('div', 'selos');
      if (o.recomendada) selos.appendChild(el('span', 'selo selo-rec', 'Recomendada pelo cálculo'));
      if (o.exata) selos.appendChild(el('span', 'selo selo-exata', '✓ Atende exatamente'));
      topo.appendChild(selos);
      card.appendChild(topo);

      var comb = el('div', 'combinacao');
      o.itens.forEach(function (i) {
        comb.appendChild(el('div', 'linha-lata',
          '<span class="qtd">' + i.quantidade + ' ×</span> ULTRAD<sup>®</sup> HA <strong>' + fmt(i.gramas) + ' g</strong>'));
      });
      card.appendChild(comb);

      card.appendChild(el('p', 'atende', '✓ Atende ao ambiente de <strong>' + fmt(r.volumeM3) + ' m³</strong>'));

      var dl = el('dl', 'dados');
      function linha(rot, val, cls) {
        dl.appendChild(el('dt', null, rot));
        dl.appendChild(el('dd', cls || null, val));
      }
      linha('Número de latas', String(o.latas));
      linha('Quantidade total', fmt(o.totalGramas) + ' g');
      linha('Excedente', fmt(o.excedenteGramas) + ' g', o.exata ? 'zero' : null);
      linha('Cobertura', fmt(o.totalGramas) + ' g ÷ 0,8 = <strong>' + fmt(o.coberturaM3) + ' m³</strong>');
      card.appendChild(dl);

      lista.appendChild(card);
    });

    resultado.hidden = false;
    resultado.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function novoCalculo() {
    form.reset();
    ['altura', 'comprimento', 'largura', 'volume'].forEach(function (id) { $(id).value = ''; });
    limparErro();
    resultado.hidden = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    (modo === 'dimensoes' ? $('altura') : $('volume')).focus();
  }

  document.querySelectorAll('.modo-btn').forEach(function (b) {
    b.addEventListener('click', function () { trocarModo(b.dataset.modo); });
  });
  form.addEventListener('submit', calcular);
  $('novo').addEventListener('click', novoCalculo);
  form.addEventListener('input', function (e) {
    e.target.classList.remove('invalido');
    // Impede o sinal de menos já na digitação
    if (e.target.value.indexOf('-') !== -1) e.target.value = e.target.value.replace(/-/g, '');
  });
})();
