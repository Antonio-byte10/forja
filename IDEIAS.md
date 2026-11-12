# Mapeamento de novas inserções

_12/11/2026 — feito a partir do código atual (v1.0.0). Nada foi alterado no app._

Esforço: **P** = algumas horas · **M** = um dia · **G** = mais de um dia.
"Lib nova" = precisa adicionar uma biblioteca e gerar um APK novo (tudo continua local, sem nuvem).

---

## 1. Desempenho e segurança dos dados (antes de o histórico crescer)

Hoje está rápido porque o histórico é pequeno. Estes pontos pesam com o tempo:

| # | O quê | Por quê | Esforço |
|---|---|---|---|
| 1.1 | **Salvar só o que mudou** | A cada número digitado no treino, o app regrava *todo* o histórico no celular (`src/store.ts`). Com ~1 ano de treinos são centenas de KB por toque de tecla. Separar o treino em andamento do histórico resolve. | M |
| 1.2 | **Calcular "Última" uma vez só** | Cada cartão de exercício varre o histórico inteiro a cada toque (`lastSets` em `treino.tsx`). Dá para calcular no início do treino e guardar. | P |
| 1.3 | **Telas atualizam só o necessário** | As telas leem o estado inteiro (`useStore()`), então qualquer mudança redesenha tudo. Ler só o que cada tela usa. | P |
| 1.4 | **Versão nos dados salvos** | Se um dia mudarmos o formato (ex.: série de aquecimento, anotações), sem versão o app antigo pode perder dados. Adicionar `version` + migração. Fazer **antes** de qualquer item que mude o formato. | P |
| 1.5 | **Fotos menores** | As 155 fotos ocupam 6,5 MB. Em WebP ficam ~2–3 MB → APK menor e abre mais rápido. | P |
| 1.6 | **Histórico com cálculo repetido** | A tela de histórico compara cada treino com o anterior procurando na lista toda (cresce ao quadrado). Pré-calcular uma vez. | P |

## 2. Durante o treino (na academia)

| # | O quê | Por quê | Esforço |
|---|---|---|---|
| 2.1 | **Tela sempre acesa no treino** | A tela apaga entre séries e o cronômetro some da vista. | P · lib nova |
| 2.2 | **Aviso de fim do descanso com tela bloqueada** | Hoje a vibração só funciona com o app aberto. Notificação local avisa mesmo com o celular no bolso. | M · lib nova |
| 2.3 | **Descanso por exercício** | Hoje é 90 s fixo para tudo. Ex.: 2–3 min no agachamento, 60 s no isolador. Campo na ficha. | P |
| 2.4 | **Sugestão de carga ("progressão dupla")** | Se bateu todas as reps da última vez, sugere +2,5 kg (ou +1 kg/lado). Mostra um ↑ ao lado da carga. | M |
| 2.5 | **Trocar exercício no meio do treino** | Aparelho ocupado → trocar por outro do mesmo grupo sem mexer na ficha. | M |
| 2.6 | **Reordenar exercícios no treino** | Mesmo motivo: fazer fora da ordem da ficha. | P |
| 2.7 | **Tipo de série** (aquecimento / normal / drop) | Aquecimento não deveria contar no volume nem virar a "Última". | M · muda formato (ver 1.4) |
| 2.8 | **Anotação rápida** por exercício | "Banco na posição 4", "doeu o ombro". Aparece no próximo treino. | P · muda formato |
| 2.9 | **Calculadora de anilhas** | Toca na carga → mostra que anilhas pôr de cada lado da barra. | P |
| 2.10 | **Bi-set / superset** | Agrupar 2 exercícios alternados; o descanso só começa depois do par. | G |

## 3. Progresso e análise

| # | O quê | Por quê | Esforço |
|---|---|---|---|
| 3.1 | **Recordes pessoais (PR)** | Maior carga, mais reps e 1RM estimado por exercício. Selo "🏆 Recorde" no treino e no histórico. | M |
| 3.2 | **Gráfico de evolução por exercício** | Carga / 1RM estimado ao longo do tempo. O `react-native-svg` já está no projeto, não precisa lib nova. | M |
| 3.3 | **Volume semanal por grupo muscular** | O catálogo já sabe o grupo de cada exercício. Mostra séries/semana de Peito, Costas etc. e onde está fraco. | M |
| 3.4 | **Resumo ao finalizar** | Tela de fim com volume, tempo, recordes batidos e comparação com a última vez. | P |
| 3.5 | **Sequência (streak) e meta semanal** | "3 de 4 treinos nesta semana". Já existe a faixa da semana; só falta a meta. | P |
| 3.6 | **Peso corporal** | Registro simples + gráfico. Útil também para barra fixa/paralelas. | M · muda formato |

## 4. Fichas e planejamento

| # | O quê | Por quê | Esforço |
|---|---|---|---|
| 4.1 | **Faixa de reps** (8–12 em vez de 10) | Base para a sugestão de carga (2.4). | P · muda formato |
| 4.2 | **Duplicar ficha** | Criar variação de uma ficha sem montar do zero. | P |
| 4.3 | **Exercício próprio com foto** | Criar exercício fora do catálogo e tirar foto do aparelho. | M · lib nova (câmera) |
| 4.4 | **Editar treino já salvo** | Corrigir uma carga digitada errado no histórico. | M |
| 4.5 | **Semana de deload** | Botão que inicia o treino com −40% de carga, sem afetar a "Última". | P |

## 5. Dados e backup

| # | O quê | Por quê | Esforço |
|---|---|---|---|
| 5.1 | **Backup como arquivo** | Hoje é copiar/colar texto; com histórico grande, colar falha ou corta. Gerar `.json` e mandar pelo WhatsApp/Drive pelo menu de compartilhar do Android. | M · lib nova |
| 5.2 | **Lembrete de backup** | "Último backup há 30 dias" na tela inicial. | P |
| 5.3 | **Exportar CSV** | Abrir o histórico no Excel/Planilhas. | P |

---

## Por onde eu começaria

1. **1.4 + 1.1 + 1.2 + 1.3** — um pacote só de "fundação": mantém o app rápido daqui a um ano e deixa o formato pronto para crescer.
2. **2.1 Tela acesa** e **2.3 Descanso por exercício** — pequenos e você sente na hora na academia.
3. **3.1 Recordes + 3.2 Gráfico** — a parte mais motivadora que falta hoje.
4. **2.4 Sugestão de carga** (com **4.1 Faixa de reps**) — transforma o app de "anotar" em "orientar".
5. **5.1 Backup em arquivo** — antes de o histórico ficar grande demais para copiar e colar.

---

Próxima versão (treino em casa, peso do corpo, corrida, atividades): ver [proxima-versao/MAPEAMENTO.md](proxima-versao/MAPEAMENTO.md).
