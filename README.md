# Treino

App pessoal de treino: fichas da academia (A/B/C) e de casa, registro por série (carga, repetições,
tempo ou distância), treino livre, atividades avulsas (corrida, futebol…), cronômetro, histórico por dia
e backup. Tudo fica salvo no celular, sem servidor.

## Rodar no computador

```bash
npm install
npm run web      # abre no navegador (use o modo celular do DevTools)
npm test         # testes da lógica (volume, carga por lado, próxima ficha)
npm run lint
npm run typecheck
```

## Gerar o APK

Tudo roda neste computador, sem conta e sem nuvem:

```bash
npm run build:apk
```

O APK sai em `dist/treino-<versão>.apk`. Mande para o celular (WhatsApp, Drive, cabo), toque nele e
permita "instalar apps de fontes desconhecidas" na primeira vez.

O script usa as ferramentas em `D:ndroid` (ou na pasta de `TREINO_ANDROID_DIR`):

- `jdk21/` — Java 21 (Eclipse Temurin)
- `sdk/` — Android SDK: plataforma 37, build-tools 37.0.0, NDK 27.1 e CMake 3.22.1
- `gradle/` — cache do Gradle
- `keys/` — chave de assinatura do app e a senha dela. **Guarde uma cópia**: sem ela, uma versão
  nova não instala por cima da antiga, e reinstalar apaga os dados do app.

Para lançar uma versão nova, aumente `expo.version` e `expo.android.versionCode` no `app.json`.

## Estrutura

- `src/app/` — telas (Expo Router): início, treino, resumo ao finalizar, fichas, histórico (com edição de treino),
  progresso (séries por grupo e gráfico por exercício), registrar atividade, backup (arquivo, texto e planilha CSV)
- `src/lib/avisos.ts` — notificação de fim do descanso (funciona com a tela bloqueada); `avisos.web.ts` é a versão do navegador
- `src/lib/arquivo.ts` — salvar/abrir arquivo de backup pelo menu de compartilhar; `arquivo.web.ts` baixa no navegador
- `src/lib/workout.ts` — regras do treino (funções puras, testadas em `workout.test.ts` e `medidas.test.ts`)
- `src/lib/boneco.ts` — boneco animado: poses (ângulos) viram formas de SVG; `src/components/Boneco.tsx` desenha
- `src/store.ts` — estado salvo no aparelho (Zustand + AsyncStorage). O treino em andamento fica numa chave
  separada, para não regravar o histórico a cada número digitado. Os dados têm versão e migração.
- `src/data/` — catálogo com 249 exercícios em 13 grupos, as poses dos bonecos (`animacoes.ts`) e as fichas de
  exemplo: A/B/C da academia e a F de casa (flexão e abdômen, sem impacto)
- `assets/exercises/` — fotos da [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (domínio público)
- `proxima-versao/` — pesquisa que deu origem à versão 1.1: galeria de fotos, ficha em HTML e mapeamento
- `scripts/` — gerar o APK, o catálogo extra (`gerar-catalogo-extra.py`) e o boneco da galeria (`gerar-boneco-web.mjs`)

Cada exercício tem uma **medida**: carga (kg × reps), repetições (peso do corpo), tempo, cardio (tempo +
distância) ou alongamento. Exercício **unilateral**: a carga digitada é por lado e o volume conta os dois
lados (carga × reps × 2).

Fichas de casa, treinos livres e atividades avulsas não mexem na sequência A → B → C da academia.
