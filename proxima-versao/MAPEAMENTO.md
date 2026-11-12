# Próxima versão: treino em casa, peso do corpo, corrida e tudo no histórico

_12/11/2026. Pesquisa e planejamento que deram origem à versão 1.1 do app._

> **Situação:** implementado na 1.1 — medidas (carga, reps, tempo, cardio, alongamento), 94 exercícios novos,
> boneco animado, treino livre, registrar atividade, histórico por dia, ficha F e versão dos dados.
> **Ainda não feito:** bi-set de verdade (a ficha F é uma lista na ordem dos pares), recordes por tipo,
> meta semanal em minutos, timer de intervalos, GPS, ícones por esporte e os bonecos de burpee, pistol e urso.

**O que tem nesta pasta**

| Arquivo | O quê |
|---|---|
| `galeria.html` | Todas as fotos com filtros (tipo, lugar, grupo). As fotos novas alternam entre início e fim do movimento. |
| `imagens/` | 81 exercícios novos × 2 fotos (`chave.jpg` = principal, `chave_2.jpg` = outra fase do movimento), 640×427, mesmo padrão das fotos atuais. 6,5 MB. |
| `exercicios.json` | Ficha de cada exercício: nome em português, grupo, tipo de medida, lugar, equipamento, nível, músculos e as instruções originais (em inglês, para traduzir depois). |
| `ficha.html` | **Ficha F: Flexão & Abdômen** (sem impacto) com as mini animações, mais o guia das variações de flexão e das funções do abdômen. |
| `ficha-flexao-abdomen.json` | A mesma ficha no formato de dados proposto para o app (seção 2.5). |
| `boneco/` | O **boneco 3D animado**: `boneco.js` desenha, `animacoes.js` guarda as poses de 25 exercícios, `teste.html` mostra cada pose parada para conferir. |
| `referencias-wger/` | 16 imagens de outra base aberta (wger.de), guardadas só como referência, com os créditos. |
| `scripts/` | Como as fotos foram baixadas, para refazer ou acrescentar mais. |

Fonte das fotos: [free-exercise-db](https://github.com/yuhonas/free-exercise-db), domínio público, a mesma das 155 fotos que o app já usa.

Para abrir a galeria, rode `python -m http.server 8765` na pasta do app e abra
`http://localhost:8765/proxima-versao/galeria.html`. Aberta direto do arquivo, o navegador pode não mostrar as fotos.

---

## 1. O que o app atual não deixa fazer

| Situação | O que acontece hoje |
|---|---|
| Treino sem peso (flexão, abdominal) | Funciona com carga 0, mas o **volume dá 0 kg**. O treino aparece como "0 kg" no histórico e a comparação em % some. |
| Prancha 45 s, alongamento 30 s | Não existe medida de **tempo**. Só dá para escrever "reps". |
| Corrida 5 km em 28 min | Não existe **distância** nem **duração**. |
| Futebol, natação, caminhada | Só dá para registrar treinos de ficha. Não existe **atividade avulsa**. |
| Treinar 2× no dia | O histórico **já salva os dois**. Mas a faixa "Esta semana" conta **dias** e não treinos (2 treinos no mesmo dia = "1 treino"). E o calendário só marca "treinou". |
| Corrida no meio da semana | A "próxima ficha" (A → B → C) olha o último treino. Uma corrida ou um treino em casa no meio **bagunçaria a sequência**. |
| Esqueceu de registrar ontem | O treino sempre fica com a data e a hora de agora. |

## 2. Proposta

### 2.1 Cada exercício passa a ter um "jeito de medir"

| Medida | O que se anota em cada série | Exemplos | O que o app soma |
|---|---|---|---|
| **Carga** (como hoje) | kg × reps | supino, leg press | volume em kg |
| **Repetições** (peso do corpo) | reps (e, se quiser, +kg de colete ou mochila) | flexão, barra, agachamento sem peso | total de reps |
| **Tempo** | segundos, com cronômetro na própria série | prancha, escalador, tesoura | tempo total |
| **Cardio** | duração + distância (opcional) | corrida, bike, remo, pular corda | km, minutos, ritmo (min/km) |
| **Alongamento** | segundos por lado | postura da criança, piriforme | minutos de mobilidade |

No `exercicios.json` cada exercício novo já vem com o campo `tipo` (`reps`, `tempo`, `cardio`, `alongamento`).
Os 155 de hoje continuam como **Carga**. Os que já existem e são sem peso (flexão, barra fixa, prancha…)
viram **Repetições** ou **Tempo**: são 26, e estão na galeria com a etiqueta "já no app".

### 2.2 Três jeitos de registrar

1. **Treino de ficha** (como hoje). A ficha ganha o campo **lugar** (academia / casa), então dá para ter
   "Casa A" ao lado de "A/B/C".
2. **Treino livre**: começa vazio e você vai adicionando exercícios. Bom para um treino improvisado em casa.
3. **Registrar atividade**: um formulário curto, sem séries:
   - tipo: corrida, caminhada, bike, natação, futebol, luta, dança, yoga, trilha ou outro;
   - **duração** (obrigatória), **distância** (opcional) e **intensidade** (leve / moderada / forte);
   - anotação;
   - **data e hora editáveis**, para lançar depois o que fez ontem.

Atividades e treinos livres **não mexem** na sequência A → B → C. Só as fichas da academia contam para "próximo treino".

### 2.3 Histórico de tudo

- **Lista agrupada por dia**: "Qui, 12 · 2 atividades · 1 h 35 min". Cada item tem um ícone pelo tipo (musculação, casa, corrida, outros).
- **Calendário e semana com cores por tipo**. A semana passa a contar **treinos** e **minutos ativos**, não só dias.
- **Meta semanal em minutos ativos**. A OMS recomenda de 150 a 300 min de atividade moderada por semana para adultos.
- **Números por tipo**:
  - musculação: volume em kg;
  - peso do corpo: total de reps;
  - cardio: km por semana e ritmo médio;
  - geral: minutos ativos e treinos por semana.
- **Recordes por tipo**:
  - mais reps numa série (flexão, barra);
  - prancha mais longa;
  - maior distância;
  - melhor ritmo nos 5 km.

### 2.4 Fichas prontas para casa (sem equipamento)

Usando só exercícios que já têm foto:

| Ficha | Exercícios |
|---|---|
| **Casa A: corpo todo** | agachamento sem peso, flexão (ou flexão inclinada), ponte de glúteo no chão, superman, prancha, salto estrela |
| **Casa B: superior** | flexão aberta, flexão diamante, mergulho no banco, remada invertida (na mesa), prancha lateral, abdominal bicicleta |
| **Casa C: inferior e core** | afundo caminhando, agachamento com salto, ponte unilateral, abdução em pé, tesoura, abdominal canivete |
| **HIIT 20 min** | escalador, salto estrela, agachamento com salto, skipping, salto lateral (40 s de esforço, 20 s de pausa) |
| **Mobilidade 10 min** | alongamento "maior do mundo", gato, postura da criança, flexor do quadril, piriforme, posterior sentado |

### 2.5 Mudanças no formato dos dados (rascunho técnico)

- `PlanExercise.medida`: `'carga' | 'reps' | 'tempo' | 'cardio' | 'alongamento'`. Hoje é sempre carga.
- `SetLog`: ganha `segundos?` e `metros?`.
- `Plan.lugar`: `'academia' | 'casa'`.
- `Session.tipo`: `'ficha' | 'livre' | 'atividade'`. Ganha também `atividade?`, `duracaoMin?`, `distanciaM?`, `intensidade?` e `nota?`.
- Os dados salvos ganham **versão** com migração automática: tudo o que existe vira `medida: 'carga'` e `tipo: 'ficha'`.
  Backups antigos continuam restaurando, porque `parseBackup` já completa campos que faltam.
- Esse é o item 1.4 do [IDEIAS.md](../IDEIAS.md). Precisa ser feito **antes**.

## 3. O que ficou sem foto (não existe na base de domínio público)

| Exercício / atividade | Alternativa |
|---|---|
| Burpee, polichinelo tradicional, joelho alto | Usar provisoriamente as fotos de salto estrela e skipping. |
| Agachamento isométrico na parede, canoa (hollow), V-up | Usar provisoriamente a foto de prancha / canivete. |
| Flexão pike, prancha com toque no ombro, perdigueiro, urso (bear crawl) | — |
| Agachamento pistol, panturrilha unilateral sem peso | Usar provisoriamente as fotos de agachamento unilateral no banco / panturrilha em pé. |
| Suspensão na barra (dead hang) | A foto da base estava errada e ficou de fora. |
| Bicicleta na rua | As duas fotos da base mostram só o capacete e o banco. Ficou de fora; a bike ergométrica entrou. |
| Natação, futebol, vôlei, basquete, luta, dança, yoga, pilates, trilha | São **atividades**, não exercícios. **Ícones** no estilo do app resolvem (não precisam de foto). |

### 3.1 Segunda pesquisa (12/11): wger.de

A base aberta do [wger](https://wger.de) tem imagem para quase todas as lacunas: flexão pike, canoa, polichinelo,
joelho alto, perdigueiro, prancha com toque no ombro, agachamento na parede, pistol. O problema é que cada
imagem tem um estilo (foto, desenho a traço, ilustração 3D) e a licença é CC BY-SA, que exige crédito.
Ficaram guardadas em `referencias-wger/` só como referência.

### 3.2 Solução escolhida: boneco 3D animado

Em vez de foto, um **manequim desenhado pelo próprio código**, com volume (sombreado de cilindro), sombra no chão e
a região mais trabalhada em verde (a cor do app). Cada exercício é só uma lista de poses (ângulos das articulações),
e o boneco anima entre elas, como as "mini animações" da galeria, só que mais suave.

| Vantagem | Por quê |
|---|---|
| Mesmo estilo em todos | Não mistura foto com desenho. |
| Quase não pesa | Uma animação tem ~1 KB de números, contra ~80 KB de duas fotos. |
| Vai para o app sem biblioteca nova | Desenha com `react-native-svg`, que o app já usa. |
| Fácil de criar mais | Uma variação nova é copiar uma pose e mudar alguns ângulos. |

Já existem **25 animações**:
- **Flexões (10):** parede, inclinada no banco, joelhos, tradicional, aberta, diamante, declinada, pike, escapular e negativa.
- **Abdômen (11):** crunch, infra, elevação de pernas, tesoura, V-up, prancha, canoa, dead bug, toque no ombro, perdigueiro e escalador lento.
- **Lacunas da base de fotos (4):** marcha com joelho alto, agachamento na parede, suspensão na barra e polichinelo.

Ainda faltam burpee, pistol e urso. As atividades (natação, futebol…) continuam melhor com **ícones**.

### 3.3 Ficha F: Flexão & Abdômen (sem impacto)

Em `ficha.html`. São 6 pares "flexão + abdominal" feitos em sequência (o abdômen trabalha enquanto braço e peito descansam), sem nenhum salto:

| Par | A: flexão | B: abdômen |
|---|---|---|
| Aquecimento | marcha com joelho alto 60 s · flexão na parede 15 · perdigueiro 8/lado · gato 30 s | |
| 1 | inclinada no banco 3×12 | abdominal (crunch) 3×15 |
| 2 | tradicional 3×8–12 | abdominal infra 3×12 |
| 3 | aberta 3×8–10 | dead bug 3×8/lado |
| 4 | diamante 3×6–10 | canoa 3×20–30 s |
| 5 | pike 3×6–8 | prancha com toque no ombro 3×10/lado |
| Final | negativa 2×5 | prancha 2×30–45 s |
| Volta à calma | postura da criança · torção da coluna · tríceps | |

- **Duração:** ~45 min completa. A versão curta (2 voltas dos pares 1 a 4) leva ~25 min.
- **Alternativas:** cada exercício traz uma opção mais fácil ou mais difícil.
- **Conceitos:** a página também explica as 5 "alavancas" da flexão (inclinação, pegada, apoio, quadril, tempo) e as 6 funções do abdômen (flexão do tronco, flexão do quadril, anti-extensão, anti-rotação, rotação, flexão lateral).

## 4. Ideias extras (opcionais)

| Ideia | Comentário | Esforço |
|---|---|---|
| **Mini animação** do exercício | Alternar as 2 fotos (início/fim), como na galeria, ou usar o boneco animado (seção 3.2), que pesa bem menos. | P–M |
| **Timer de intervalos** (HIIT, Tabata, EMOM) | Ex.: 20 s de esforço e 10 s de pausa, 8 vezes, com vibração em cada troca. | M |
| **Corrida com GPS** | Mede distância e ritmo sozinho. Precisa de permissão de localização e de funcionar com a tela bloqueada. Começar pelo registro manual. | G |
| **Importar do relógio/celular** (Health Connect do Android) | Puxar corridas e passos de outros apps. Precisa de biblioteca nativa: confirmar compatibilidade antes. | G |
| **Peso extra no peso do corpo** | Barra com colete de 10 kg: reps + kg extra, com volume contado. | P |

## 5. Ordem sugerida para a próxima versão

1. **Base**: versão dos dados e campo `medida` (sem mudar nada visível).
2. **Medidas Repetições e Tempo**, com cronômetro na série, e os exercícios novos de peso do corpo no catálogo.
3. **Registrar atividade**, com duração, distância e data editável, e o **histórico agrupado por dia**.
4. **Fichas de casa**: campo lugar e as fichas prontas.
5. **Resumo semanal**: minutos ativos, km e recordes por tipo.
6. Extras: timer de intervalos, mini animação, GPS.
