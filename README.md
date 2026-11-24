<h1>
  <picture>
    <source media="(max-width: 600px)" srcset="docs/telas/capa-forja-mobile.png">
    <img src="docs/telas/capa-forja.png" alt="Forja — cartão de supino reto com uma série de 55 kg e 10 repetições concluída" width="100%">
  </picture>
</h1>

Criei o Forja para registrar meus treinos e, com o tempo, ampliei o app para acompanhar também minha alimentação, meu sono e meu progresso.

O app é de código aberto, em português, e guarda os registros no próprio Android.

<p align="center">
  <img src="docs/telas/inicio.jpg" alt="Tela inicial" width="30%">
  <img src="docs/telas/treino.jpg" alt="Treino em andamento" width="30%">
  <img src="docs/telas/progresso.jpg" alt="Progresso" width="30%">
</p>

## O que ele faz

Em **Início → Planejar semana**, escolha uma ficha para o dia ou mova um treino para outra data livre. A ficha agendada para hoje ganha prioridade no Início. A agenda reconhece a conclusão pelo dia de início e pela ficha registrada no histórico.

Em **Progresso → Minha semana**, o gráfico mostra minutos de treino nos últimos sete dias. Toque em um dia para abrir seu diário. O painel também apresenta refeições marcadas e a média de sono das noites com registro.

O **Perfil energético** é opcional. A estimativa em kcal/dia usa peso, altura, idade, sexo e nível habitual de atividade do perfil salvo. Aplica as equações para adultos a partir de 19 anos, fora da gestação e da amamentação. O resultado já inclui atividade física e representa uma média populacional para aquele perfil. [Equações EER das DRI, Health Canada](https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/equations-estimate-energy-requirement.html)

**No treino**
- Na academia, as fichas A (peito e tríceps), B (costas e bíceps) e C (pernas e ombros) se alternam. A D (corpo inteiro) aparece no sábado ou domingo, uma vez por fim de semana. A ficha de casa fica disponível à parte.
- Cada série já vem com a carga e as repetições da última vez ("Última")
- **Sugestão de carga** (progressão dupla): bateu o topo da faixa de reps em todas as séries? Vem +2,5 kg
- Selo de **recorde**, **calculadora de anilhas** por lado e **anotação** por exercício (ex.: "banco 4")
- Cronômetro de descanso por exercício, com **aviso mesmo com a tela bloqueada**, e a tela fica acesa
- Trocar exercício (aparelho ocupado), mudar a ordem, treino livre e atividades avulsas (corrida, futebol…)
- Medidas por tipo: carga × reps, só reps (peso do corpo), tempo (prancha), cardio (tempo + km), alongamento
- Catálogo com fotos e animações. O grupo Lutas inclui jiu-jitsu, boxe, muay thai, judô e krav magá para fichas com séries por tempo e atividades avulsas.

**No progresso**
- Resumo ao finalizar: volume, recordes batidos e comparação com a última vez
- Gráfico de evolução por exercício (maior carga, 1RM estimado, volume)
- Séries por grupo muscular na semana, com a marca de 10 séries
- Peso corporal com gráfico, **fotos de progresso** por dia de treino e comparação antes/depois
- **Passos do dia** lidos do Health Connect (opcional)
- Meta semanal de treinos e sequência de semanas batendo a meta

**Na nutrição**
- Plano alimentar manual ou importado de um PDF com Gemini, com revisão de porções, alternativas e dias da semana antes de aplicar.
- Diário com refeições concluídas, peso, altura, cintura, fotos e notas. Toque em uma data no calendário para consultar ou corrigir o registro.
- Na revisão do PDF, toque em uma refeição para abrir a página indicada pelo Gemini. O documento fica disponível durante a revisão. No diário, escolha uma alternativa ou anote o que consumiu.
- Em **Calendário → Resumo para o nutricionista**, selecione o período. O PDF inclui medidas, variação de peso e refeições registradas. Notas e fotos entram por escolha individual do usuário.
- O plano vale a partir do dia em que é aplicado. Os dias anteriores usam a versão vigente na época.

**Seus dados**
- Histórico por dia, com edição de treino já salvo
- Backup em arquivo `.json` (pelo menu de compartilhar), em texto, e exportação em planilha CSV

## Sono no Android

Em **Nutrição → Diário → Sono e disposição**, registre a duração manualmente (por exemplo, `7:30`) e como você se sentiu. No Android compatível, **Conectar sono do Android** solicita permissão de leitura de sono. O Forja consulta o Health Connect quando você abre o diário do dia. Para abranger a noite que termina nessa data, soma o intervalo do meio-dia anterior até o meio-dia do dia selecionado. A leitura automática respeita registros manuais. É possível desligá-la no cartão ou revogar a permissão no Android.

No **Samsung Health → Configurações → Health Connect**, permita que o Samsung Health grave sono. Um Galaxy Watch sincroniza primeiro com o Samsung Health no telefone. Para outras marcas, confira se o aplicativo da pulseira ou do relógio publica sessões de sono no Health Connect. Sem uma fonte de dados, use o registro manual. [Integração da Samsung](https://developer.samsung.com/health/health-connect-faq.html) · [Sono no Health Connect](https://developer.android.com/health-and-fitness/health-connect/features/sleep-sessions)

## Privacidade

O diário, as medidas e as fotos ficam no aparelho. Ao confirmar uma importação por IA, o PDF escolhido é enviado à API Gemini da Google por um serviço no seu computador. O serviço lê o PDF em memória. O backup JSON inclui planos alimentares, medidas e notas pessoais. Fotos podem ser compartilhadas separadamente.

| Permissão | Para quê |
|---|---|
| Notificações | Avisar o fim do descanso com a tela bloqueada |
| Câmera | Tirar fotos de progresso |
| Sono (Health Connect) | Ler a duração da noite e armazenar o resultado no diário |
| Passos (Health Connect) | Mostrar os passos do dia; o Forja só lê, nunca grava |

## Instalar

Baixe o APK na página de [Releases](../../releases) (quando houver) ou gere o seu, como abaixo.
No celular, abra o arquivo e permita "instalar apps de fontes desconhecidas" na primeira vez.

## Rodar e testar no computador

O ambiente testado usa [Node.js](https://nodejs.org) 24.19.0 e npm.

```bash
npm ci
npm run web        # abre no navegador; use o modo celular do DevTools
npm test           # testes da lógica (volume, progressão, recordes, backup…)
npm run lint
npm run typecheck
```

No navegador não há notificação, passos nem câmera; o resto funciona igual.

## Usar o Gemini para planos e mensagens

O preenchimento manual funciona offline. A importação de PDF e a mensagem motivacional passam por um servidor seu (`scripts/servidor-ia.mjs`), que guarda a chave do Gemini. O app nunca recebe a chave. O modelo padrão é `gemini-3.5-flash-lite`; troque em `GEMINI_MODEL` se quiser.

### Servidor de IA no Render (recomendado para o celular)

Assim o celular usa a IA pela internet, sem cabo nem computador ligado. Nenhum segredo vai para o GitHub.

1. No Render, crie um **Blueprint** a partir do seu fork deste repositório. O `render.yaml` cria o serviço `forja-ia` no plano gratuito.
2. Quando o Render pedir, cole a sua `GEMINI_API_KEY`. O `FORJA_TOKEN` é gerado pelo próprio Render.
3. Depois do deploy, copie o endereço do serviço (`https://….onrender.com`) e o valor de `FORJA_TOKEN` (em **Environment**).
4. No app, abra **Progresso → Configurar servidor de IA** (aparece depois de uma falha) ou **Nutrição → Plano → Configurar servidor de IA**. Preencha endereço e código, toque em **Testar conexão** e em **Salvar**.

Quem gera o próprio APK pode deixar isso pronto: preencha `EXPO_PUBLIC_IA_URL` e `EXPO_PUBLIC_IA_TOKEN` no `.env.local` antes de `npm run build:apk`. Esses valores ficam dentro do APK; use só no seu aparelho.

No plano gratuito o Render desliga o serviço depois de um tempo sem uso. O primeiro pedido depois disso leva até 1 minuto, e o app espera esse tempo. Sem `FORJA_TOKEN`, o servidor se recusa a subir em modo público.

### Servidor no computador

Use Node 22.18 ou posterior. Copie `.env.example` para `.env.local`, preencha `GEMINI_API_KEY` e execute `npm run ia`. O serviço escuta só em `127.0.0.1:8787` e é o endereço padrão do app quando nada foi configurado. Na web, abra o Forja por `localhost`. No Android, encaminhe a porta com `adb reverse tcp:8787 tcp:8787`.

### O que é enviado

Em **Nutrição → Plano**, **Importar PDF com Gemini** envia o PDF escolhido (até 8 MB) depois da sua confirmação. Você revisa as refeições antes de aplicar. Em **Progresso → Gerar mensagem com IA**, vai ao Gemini somente a contagem de dias com treino nos últimos sete dias. O painel mostra uma mensagem local quando o servidor está desligado. Endereço e código do servidor ficam só no aparelho e não entram no backup JSON.

## Gerar o APK (local, sem nuvem)

```bash
npm run build:apk
```

O APK sai em `dist/forja-<versão>.apk`. O script ([scripts/build-apk.mjs](scripts/build-apk.mjs)) usa as
ferramentas da pasta indicada em `TREINO_ANDROID_DIR` (padrão `D:/android`):

- `jdk21/`: Java 21 (Eclipse Temurin)
- `sdk/`: Android SDK (plataforma, build-tools, NDK e CMake)
- `gradle/`: cache do Gradle
- `keys/treino-keystore.properties`: caminho e senha da **sua** chave de assinatura (não vai para o repositório)

Use sempre a mesma chave: sem ela, uma versão nova não instala por cima da antiga. Para lançar uma versão,
aumente `expo.version` e `expo.android.versionCode` no `app.json`.

## Como o código está organizado

| Pasta | O quê |
|---|---|
| `src/app/` | Telas (Expo Router): início, treino, resumo, fichas, histórico, progresso, fotos, backup… |
| `src/lib/workout.ts` | Regras do treino em funções puras, testadas em `workout.test.ts` e `medidas.test.ts` |
| `src/lib/*.web.ts` | Versões para o navegador do que só existe no celular (avisos, arquivos, fotos, passos) |
| `src/store.ts` | Estado salvo no aparelho (Zustand + AsyncStorage), com versão e migração dos dados |
| `src/data/` | Catálogo de exercícios, poses do boneco animado e fichas de exemplo |
| `assets/` | Ícones (gerados por `scripts/gerar-icones.py`) e fotos dos exercícios |
| `proxima-versao/` | Pesquisa e protótipos que deram origem à versão 1.1 |

Feito com [Expo](https://expo.dev) (React Native), TypeScript e `react-native-svg` para gráficos e bonecos.

## Contribuir

Ideias e correções são bem-vindas: abra uma *issue* ou um *pull request*. Antes, rode `npm test`,
`npm run lint` e `npm run typecheck`. A lista de ideias ainda abertas está em [IDEIAS.md](IDEIAS.md).

## Créditos e licença

- Código: [MIT](LICENSE).
- As fotos das modalidades de luta têm [créditos e licenças individuais](assets/exercises/CREDITOS-LUTAS.md).
- Demais fotos dos exercícios: [free-exercise-db](https://github.com/yuhonas/free-exercise-db), domínio público.
- Imagens de referência em `proxima-versao/referencias-wger/`: [wger](https://wger.de), CC BY-SA 4.0
  (autores em [CREDITOS.md](proxima-versao/referencias-wger/CREDITOS.md)).
- Ícones da interface no estilo [Lucide](https://lucide.dev) (ISC). Fontes Barlow e Barlow Condensed (SIL OFL).
