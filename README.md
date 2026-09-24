# Calculadora Comercial ULTRAD® HA

Ferramenta web da **Fermentech** para o time comercial calcular, em poucos segundos, quanto **ULTRAD® HA** (Kersia) um ambiente precisa e quais embalagens atendem essa necessidade.

## Objetivo

A partir das dimensões do ambiente (ou do volume em m³), a aplicação calcula a necessidade de ULTRAD® HA em gramas e mostra as combinações possíveis das embalagens disponíveis (80 g, 200 g, 400 g e 1.000 g), destacando a de menor excedente.

**Dimensões → Volume → Dosagem → Embalagem**

## Funcionalidades

- **Cálculo por dimensões:** altura/pé-direito × comprimento × largura.
- **Cálculo por volume:** informe diretamente o volume do ambiente em m³.
- **Necessidade em gramas** com a dosagem de 0,8 g/m³.
- **Sugestões de embalagens:** combinações de latas que atendem ou ultrapassam a necessidade, nunca abaixo dela. Cada opção mostra:
  - as latas e o número de latas;
  - a quantidade total;
  - o excedente;
  - a cobertura (ex.: `200 g ÷ 0,8 = 250 m³`).
- **Destaques:** "Recomendada pelo cálculo" na opção de menor excedente e "Atende exatamente" quando o excedente é zero.
- **Volumes pequenos:** aviso quando a necessidade é menor que a menor embalagem (80 g), sem alterar o cálculo original.
- **Sem limite de volume.** O algoritmo combina várias latas para volumes grandes.
- **Entrada no padrão brasileiro:** vírgula decimal (`3,80`) e ponto de milhar (`1.250`).
- **Validação** de campos vazios, valores negativos e valores inválidos.
- **Botão "Novo cálculo"** para reiniciar.
- **Layout responsivo** (computador, tablet e celular) com tema claro e escuro.

## Cálculo

```text
Volume = Altura × Comprimento × Largura
```

```text
Necessidade = Volume × 0,8 g
```

O volume e a necessidade são arredondados para 2 casas decimais. Exemplo: 3,80 × 8,60 × 5,30 = 173,20 m³ → 138,56 g.

### Quais combinações são mostradas

1. São consideradas apenas combinações que **atendem ou ultrapassam** a necessidade e que não têm lata sobrando (retirar qualquer lata deixaria abaixo da necessidade).
2. São mostradas:
   - todas as combinações que nenhuma outra supera ao mesmo tempo em excedente **e** número de latas;
   - alternativas com o mesmo menor excedente, com até 2 latas a mais que a melhor.
   - No máximo 5 opções.
3. Ordem: menor excedente, depois menor número de latas. A primeira recebe o selo "Recomendada pelo cálculo".

Exemplo com 200 m³ (160 g): **2 × 80 g** (excedente 0 g) e **1 × 200 g** (excedente 40 g).

## Apresentações

| Apresentação | Cobertura |
| ------------ | --------: |
| 80 g         |    100 m³ |
| 200 g        |    250 m³ |
| 400 g        |    500 m³ |
| 1.000 g      |  1.250 m³ |

## Estrutura

```text
├── src/
│   ├── index.html        # tela da calculadora
│   ├── styles.css        # identidade visual (tema claro e escuro)
│   ├── app.js            # interação da tela
│   └── calculadora.js    # regras de cálculo (sem dependência da tela)
├── tests/
│   └── calculadora.test.js
├── scripts/
│   ├── servidor.js       # servidor local (npm start)
│   └── build.js          # gera public/ e o arquivo único (npm run build)
├── vercel.json           # configuração de publicação na Vercel
├── CHANGELOG.md
└── package.json
```

## Como executar

Requer [Node.js](https://nodejs.org/) 18 ou superior. Não há dependências para instalar.

**Opção 1: abrir direto no navegador**

Abra o arquivo `src/index.html`.

**Opção 2: servidor local**

```bash
npm start
```

Depois acesse http://localhost:5173.

**Testes**

```bash
npm test
```

**Build para publicação**

```bash
npm run build
```

O comando roda os testes e gera:

- `public/`: o site publicado pela Vercel.
- `dist/calculadora-ultrad-ha.html`: um único arquivo com HTML, CSS e JavaScript embutidos.

As duas pastas são geradas e não são versionadas.

## Publicação (Vercel)

**Endereço:** https://calculadora-ultrad.vercel.app

O projeto está conectado à Vercel pelo GitHub. Cada push na `main` gera uma nova publicação. A configuração fica no [vercel.json](vercel.json):

- **Comando de build:** `npm run build`. Ele roda os testes e, se algum teste de cálculo falhar, a publicação é cancelada.
- **Pasta publicada:** `public/`, gerada pelo build a partir de `src/`. Por ser gerada, não é versionada.

Como `public/` é a pasta padrão da Vercel, a publicação funciona mesmo sem o `vercel.json`.

## Versionamento

O projeto usa **Git** para o controle de versões e o **GitHub** como repositório remoto. O histórico do Git é o registro oficial do projeto: não são criadas cópias manuais (`_v2`, `_final`, etc.).

- **Branch principal:** `main`, sempre com a versão estável.
- **Alterações maiores:** feitas em branches próprias (ex.: `feature/historico-calculos`, `fix/arredondamento`), que depois são integradas à `main`.
- **Commits:** seguem o padrão `feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `test:`, `chore:`.
- **Versões estáveis:** marcadas com tags no [Semantic Versioning](https://semver.org/lang/pt-BR/) (`vMAJOR.MINOR.PATCH`):
  - **PATCH:** correções.
  - **MINOR:** novas funcionalidades compatíveis.
  - **MAJOR:** mudanças incompatíveis.
- **Mudanças por versão:** registradas no [CHANGELOG.md](CHANGELOG.md).

### Consultar ou recuperar uma versão anterior

Listar as versões:

```bash
git tag -l
```

Ver o que mudou entre duas versões:

```bash
git log v1.0.0..v1.1.0 --oneline
```

Abrir o código de uma versão, só para consulta:

```bash
git switch --detach v1.0.0
```

Voltar para a versão atual:

```bash
git switch main
```

Para desfazer um commit problemático na `main`, use `git revert`. Ele cria um novo commit que desfaz as mudanças e preserva o histórico:

```bash
git revert <hash-do-commit>
```
