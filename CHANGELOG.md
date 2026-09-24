# Changelog

Todas as mudanças relevantes deste projeto são registradas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e o projeto usa [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.0.1] - 2026-09-24

Publicação na Vercel: https://calculadora-ultrad.vercel.app

### Adicionado
- Configuração de publicação na Vercel (`vercel.json`).

### Corrigido
- Erro "No Output Directory named public" na Vercel. O `npm run build` agora roda os testes e gera a pasta `public/` a partir de `src/`.

## [1.0.0] - 2026-09-24

Primeira versão estável.

### Adicionado
- Calculadora por dimensões (altura × comprimento × largura).
- Calculadora por volume informado diretamente em m³.
- Cálculo de dosagem de 0,8 g/m³.
- Apresentações de 80 g, 200 g, 400 g e 1.000 g.
- Cálculo automático de combinações de embalagens, que nunca fica abaixo da necessidade, ordenado por menor excedente e depois por menor número de latas.
- Destaques "Recomendada pelo cálculo" e "Atende exatamente".
- Cobertura de cada opção (gramas ÷ 0,8).
- Aviso para necessidades menores que a menor apresentação (80 g).
- Interface comercial responsiva com a identidade visual da Fermentech e tema claro e escuro.
- Entrada numérica no padrão brasileiro, com validação de campos.
- Testes automatizados com os exemplos da especificação.
- Script de build que gera um arquivo HTML único para publicação.

[1.0.1]: https://github.com/RafaelAlves-Fermentech/calculadora-ultrad/releases/tag/v1.0.1
[1.0.0]: https://github.com/RafaelAlves-Fermentech/calculadora-ultrad/releases/tag/v1.0.0
