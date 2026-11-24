# Forja · estado do app e próximas entregas

Revisão de 21 de novembro de 2026 sobre a versão 1.3.0. O aplicativo funciona sem conta. O treino em andamento é gravado separadamente das fichas, do histórico e do diário. O serviço local de importação de PDF é opcional.

## O que já está disponível

| Área | O que a pessoa consegue fazer hoje |
|---|---|
| Treino | Alternar fichas de academia ou casa, duplicar fichas, fazer treino livre e registrar atividades. O catálogo traz 254 exercícios. Durante a sessão é possível trocar a ordem, substituir exercícios, anotar, cronometrar e usar a última carga como referência. |
| Histórico e progresso | Retomar o treino, concluir com resumo, editar a sessão salva e consultar gráficos por exercício, séries por grupo muscular, peso, metas semanais e fotos comparativas. |
| Nutrição e diário | Montar o plano manualmente ou revisar um PDF importado com Gemini, escolher alternativas e consultar a versão do plano que valia em cada data. Há registro de refeições, peso, altura, cintura, sono, disposição e notas. |
| Consulta | Selecionar um período e preparar um relatório para o nutricionista. A pessoa escolhe quais fotos e notas incluir. |
| Dados e integrações | Exportar e restaurar fichas, histórico, peso e nutrição em JSON. Exportar histórico em CSV. Fotos são compartilhadas separadamente. Passos e leitura automática de sono dependem do Health Connect no Android. |

## Verificação local em 21/11/2026

No Edge, em uma janela de 390 × 844 com dados fictícios, uma série de 40 kg × 10 repetições sobreviveu ao recarregamento. Cancelar a finalização manteve a sessão aberta. Confirmar mostrou 400 kg no resumo e gerou uma única sessão no backup. Finalizar um treino livre vazio preservou essa contagem.

O teste também cadastrou uma refeição manualmente, marcou seu consumo, registrou peso e nota e abriu a prévia para consulta. A refeição apareceu no relatório e a nota ficou privada por padrão. Um perfil vazio restaurou o JSON, preservou o ID da sessão, as medidas e o diário após recarregar, e exportou o CSV.

Passaram os 67 testes automatizados, lint, TypeScript, as 20 verificações do Expo Doctor e a exportação dos bundles Android e iOS. O teste do serviço Gemini usou respostas simuladas. Câmera, Health Connect, notificações com tela bloqueada e compartilhamento nativo aguardam teste em aparelho. O npm audit encontrou um aviso moderado em minimatch, propagado para oito entradas na árvore do Expo e do ESLint. A correção automática proposta para o Expo retrocede ao SDK 52.

## Planejamento e painel pessoal na versão local

Em Início, a agenda semanal permite escolher uma ficha por dia e remarcar para uma data livre. A ficha de hoje aparece no cartão de início e ganha o estado concluído ao salvar o treino correspondente. Em Progresso, o painel cobre os últimos sete dias, com minutos de treino por dia, sessões, refeições e média de sono. Cada barra abre o diário da data.

O perfil opcional estima o gasto energético diário de adultos a partir das medidas e da atividade habitual informadas. O painel também oferece uma mensagem local e uma mensagem opcional do Gemini baseada apenas na contagem de dias com treino. Agenda e perfil acompanham o backup JSON.

## Próximas funcionalidades

| Ordem | Entrega | Primeira versão que dá para testar |
|---|---|---|
| 1 | Treino curto para dias corridos | Marcar os exercícios prioritários de uma ficha e abrir sua versão curta. Antes de começar, ver o que entrou e o que ficou de fora. A ficha completa continua disponível para a próxima sessão. |
| 2 | Perfil de equipamentos | Salvar o que há em casa ou na academia. Ao substituir um exercício, oferecer primeiro os do mesmo grupo que usam os equipamentos disponíveis. Começar pelas fichas padrão e indicar exercícios ainda sem classificação. |
| 3 | Lista de compras do plano | Reunir as refeições dos dias escolhidos, permitir selecionar alternativas e riscar itens. Começar com uma lista editável. Para somar quantidades, o plano precisará distinguir ingrediente, quantidade e unidade. |

Outras ideias do levantamento anterior continuam disponíveis para uma rodada posterior: tipo e esforço da série, bi-set com descanso após o par, semana de carga reduzida, exercício próprio com foto, braço e coxa no diário, backup local com fotos, tema claro e widget Android. A cintura já está no diário. Para otimizar as imagens, medir tamanho e tempo de carregamento antes de decidir por WebP. O protótipo e as fontes do catálogo estão no [mapeamento de exercícios](proxima-versao/MAPEAMENTO.md).

## Supabase depois da experiência local

| Etapa | Modelo proposto | Critério de aceite |
|---|---|---|
| 1. Recuperar ao trocar de celular | A pessoa ativa uma conta e solicita uma cópia. Guardar o JSON atual em um bucket privado e em uma tabela de backups registrar dono, caminho, data, versão do formato e tamanho. Oferecer prévia com data e contagens antes de restaurar. | Um aparelho limpo recupera fichas, sessões, medidas e diário. Uma segunda conta fica sem acesso ao arquivo tanto pela tabela quanto pelo armazenamento. |
| 2. Incluir fotos por escolha | Enviar os arquivos escolhidos ao Storage e guardar em uma tabela o dono, a chave do arquivo, a data e o vínculo opcional com o treino. A URI local serve somente no aparelho de origem. | Em outro aparelho, as fotos escolhidas abrem no dia correto. Uma transferência interrompida pode ser retomada sem gerar fotos duplicadas. |
| 3. Sincronizar dois aparelhos | Começar por fichas e sessões. Identificar cada registro pelo dono e pelo ID estável, acomodando os IDs de texto já existentes. Registrar versão e exclusões. Uma fila local reenvia a operação ao reconectar, com um identificador único por alteração. | Registrar treino offline, reconectar duas vezes e obter uma única sessão. Se dois aparelhos editarem a mesma ficha, preservar as duas alterações para resolução explícita. Uma exclusão confirmada continua valendo quando o outro aparelho volta. |

Aplicar políticas por proprietário nas tabelas e nos objetos privados. Liberar ao app apenas as operações necessárias. Validar leitura, alteração e exclusão com duas contas de teste. Sono, medidas e fotos entram na nuvem conforme as opções mostradas à pessoa. [Políticas de acesso por linha](https://supabase.com/docs/guides/database/postgres/row-level-security) · [Buckets privados](https://supabase.com/docs/guides/storage/buckets/fundamentals)
