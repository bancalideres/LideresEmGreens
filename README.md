# Líderes em Greens — Central de Palpites

Site público estático com visual preto e laranja.

## Ativar GitHub Pages
Em **Settings > Pages > Build and deployment**, escolha **Deploy from a branch**, branch **main** e pasta **/(root)**. Salve. Endereço esperado: https://bancalideres.github.io/LideresEmGreens/

## Atualizar conteúdo
Edite `dados.json`. Campos: `instagram`, `group`, `manager`, `people` e `galleries`.
As imagens devem ser enviadas para `imagens/`, e seus caminhos adicionados em `galleries[].images`.

Exemplo de galeria:
`{"title":"Palpites do dia","date":"2026-11-09","images":["imagens/palpite-1.jpg"]}`

## Segurança
Não coloque senhas ou tokens neste repositório público. GitHub Pages é estático: painel de edição remota exige autenticação e API segura, não incluídas nesta primeira publicação.
