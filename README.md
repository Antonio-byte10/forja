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

Precisa de uma conta grátis em https://expo.dev.

```bash
npx eas-cli@latest login
npm run build:apk
```

O build roda na nuvem da Expo e termina com um link para baixar o `.apk`. No celular, permita
"instalar apps de fontes desconhecidas" para instalar.

## Estrutura

- `src/app/` — telas (Expo Router): início, treino, fichas, histórico, backup
- `src/lib/workout.ts` — regras do treino (funções puras, testadas em `workout.test.ts`)
- `src/store.ts` — estado salvo no aparelho (Zustand + AsyncStorage)
- `src/data/` — catálogo de exercícios e fichas de exemplo
- `assets/exercises/` — fotos da [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (domínio público)

Exercício **unilateral**: a carga digitada é por lado e o volume conta os dois lados (carga × reps × 2).
