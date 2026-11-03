# Treino

App pessoal de treino: fichas A/B/C, registro de carga e repetições por série, volume total,
cronômetro de descanso, histórico e backup. Tudo fica salvo no celular, sem servidor.

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

- `src/app/` — telas (Expo Router): início, treino, fichas, histórico, backup
- `src/lib/workout.ts` — regras do treino (funções puras, testadas em `workout.test.ts`)
- `src/store.ts` — estado salvo no aparelho (Zustand + AsyncStorage)
- `src/data/` — catálogo com 155 exercícios em 10 grupos musculares e as fichas A/B/C de exemplo (5 exercícios cada)
- `assets/exercises/` — fotos da [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (domínio público)

Exercício **unilateral**: a carga digitada é por lado e o volume conta os dois lados (carga × reps × 2).
