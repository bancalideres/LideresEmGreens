# Líderes em Greens — Central de Palpites

Site público: https://bancalideres.github.io/LideresEmGreens/

## API segura do painel (Cloudflare Worker)

O arquivo `worker.js` implementa autenticação e gravação no GitHub. **Nunca coloque os segredos no repositório.**

1. No Cloudflare, abra **Workers & Pages** e crie um Worker chamado `lideres-em-greens-api`.
2. Cole o conteúdo de `worker.js` no editor do Worker e publique.
3. Em **Settings > Variables and Secrets**, crie estas variáveis como secrets:
   - `ADMIN_USER`: usuário de administração escolhido.
   - `ADMIN_PASSWORD`: senha administrativa. Use a senha escolhida, sem a publicar no GitHub.
   - `SESSION_SECRET`: gere uma chave aleatória longa e exclusiva (32 bytes ou mais).
   - `GITHUB_TOKEN`: token fine-grained do GitHub, limitado somente ao repositório `LideresEmGreens`, com **Contents: Read and write**.
4. Em **Settings > Variables and Secrets**, defina a variável normal `GITHUB_TOKEN` como secret (não como texto público).
5. Em **Settings > Triggers**, confirme que o Worker está publicado em um endereço `workers.dev`.
6. A API aceita requisições apenas com origem do GitHub Pages deste projeto.

### Rotas
- `POST /api/login`: autentica usuário e senha e retorna token de sessão de 8 horas.
- `GET /api/data`: lê os dados da central com token.
- `PUT /api/data`: grava dados e limita a galeria a cinco publicações.
- `POST /api/image`: grava imagem JPEG, PNG ou WebP na pasta `imagens/`.

## Conteúdo do site

Edite `dados.json` para definir `instagram`, `group`, `manager`, `people` e `galleries`. As imagens precisam estar na pasta `imagens/`.

## Importante
O Worker já está versionado no repositório, mas precisa ser implantado na conta Cloudflare e receber os secrets acima. Não use token pessoal em JavaScript público. A interface de login do site deve apontar para a URL real do Worker após a publicação.
