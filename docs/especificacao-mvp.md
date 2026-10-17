# Especificação geral do MVP — Comunicação integrada para eventos esportivos

## 1. Visão geral

O projeto consiste em uma aplicação para centralizar a comunicação entre a organização de um evento esportivo e os responsáveis pelas equipes participantes.

O MVP permitirá consultar a programação dos jogos, receber avisos direcionados e acessar informações essenciais sem internet. Quando o administrador alterar o horário ou o local de um jogo, o sistema atualizará a programação e publicará um aviso. Caso a alteração seja crítica, também solicitará o envio de SMS ao responsável pela equipe afetada.

A aplicação será organizada em dois temas:

- **Tema 1 — SMS:** integração para envio de alertas críticos.
- **Tema 2 — Frontend e backend:** interfaces, gestão dos dados, regras de negócio, armazenamento offline e sincronização.

## 2. Objetivo do MVP

Demonstrar o seguinte fluxo completo:

1. O responsável consulta a programação da sua equipe.
2. As informações são armazenadas no dispositivo.
3. O responsável consegue consultar os dados mesmo sem internet.
4. O administrador altera o horário ou o local de um jogo.
5. O sistema gera um aviso para as equipes afetadas.
6. Se a alteração for crítica, o backend solicita o envio de SMS.
7. Quando o aplicativo se conecta novamente, a programação e os avisos são atualizados.

O funcionamento offline contempla informações previamente baixadas. Novas alterações somente aparecem no aplicativo após uma sincronização bem-sucedida.

## 3. Usuários do sistema

| Perfil | Permissões no MVP |
|---|---|
| Administrador | Consultar todos os jogos, alterar horário e local, publicar avisos e consultar o resultado da solicitação de SMS. |
| Responsável pela equipe | Consultar a agenda da sua equipe, ler avisos e acessar instruções e informações de transporte. |

Para simplificar a apresentação, os usuários e as equipes serão previamente cadastrados. O MVP não terá cadastro público nem recuperação de senha.

---

## 4. Tema 1 — Integração de SMS

### Objetivo

Enviar uma mensagem ao responsável pela equipe quando houver uma alteração classificada como crítica.

### Escopo geral

A integração deverá:

- Receber uma solicitação do backend principal.
- Identificar o alerta e o telefone destinatário.
- Enviar o texto recebido por meio de um provedor de SMS.
- Retornar o identificador e o resultado inicial da solicitação.
- Evitar envios duplicados para o mesmo alerta e destinatário.

O backend principal será responsável por determinar quem deve receber a mensagem e qual será o conteúdo.

O envio de SMS depende de cobertura celular e pode sofrer atrasos ou falhas. Uma solicitação aceita pelo provedor não deverá ser apresentada como confirmação de leitura ou entrega.

### Dados de integração

| Campo | Descrição |
|---|---|
| Identificador do alerta | Referência única utilizada para rastrear a solicitação e evitar duplicidade. |
| Telefone destinatário | Número do responsável com código do país e DDD. |
| Mensagem | Texto completo da alteração. |
| Identificador do envio | Referência devolvida pela integração. |
| Estado do envio | Resultado disponível, como aceito ou falhou. |
| Motivo da falha | Informação devolvida quando o envio não puder ser solicitado. |

Os detalhes internos da integração serão definidos pela equipe responsável pelo Tema 1.

---

## 5. Tema 2 — Frontend e backend

### 5.1. Módulo de acesso e identificação da equipe

**Objetivo:** identificar o perfil utilizado e determinar quais informações estarão disponíveis.

**Funcionalidades**

- Acessar a aplicação com usuários de demonstração previamente cadastrados.
- Identificar se o usuário é administrador ou responsável.
- Associar o responsável à sua equipe.
- Direcionar cada perfil para sua área inicial.
- Permitir encerrar a sessão.

**Regras**

- O administrador poderá consultar os dados de todas as equipes.
- O responsável visualizará somente as informações destinadas à sua equipe e os comunicados gerais.
- Alterações administrativas deverão ser autorizadas pelo backend; ocultar botões no frontend não será suficiente.
- O primeiro acesso e o download inicial dos dados exigirão conexão.
- A consulta offline será permitida após um acesso conectado, enquanto a sessão local estiver válida.

**Critério de aceite:** o administrador consegue editar jogos e o responsável consegue apenas consultar as informações permitidas.

### 5.2. Módulo de dados básicos do evento

**Objetivo:** fornecer os cadastros necessários para que as demais funcionalidades operem.

O MVP utilizará dados previamente cadastrados para evitar a construção de telas administrativas que não sejam essenciais à apresentação.

**Dados necessários**

| Entidade | Informações mínimas |
|---|---|
| Evento | Identificador e nome. |
| Equipe | Identificador, nome e instituição. |
| Responsável | Identificador, nome, equipe e telefone. |
| Jogo | Identificador, modalidade, equipes participantes, data, horário e local. |
| Local | Identificador, nome e endereço ou orientação de acesso. |

**Regras**

- Cada equipe da demonstração deverá ter um responsável com telefone configurado.
- Um jogo deverá estar associado às equipes participantes.
- Os dados deverão permanecer salvos no backend após reiniciar a aplicação.
- Para a apresentação, deverão ser utilizados dados fictícios e um telefone autorizado para o teste de SMS.

**Critério de aceite:** a aplicação inicia com equipes, responsáveis e jogos suficientes para demonstrar uma alteração e seus destinatários.

### 5.3. Módulo de agenda da equipe

**Objetivo:** permitir que o responsável consulte os compromissos da equipe de maneira clara.

**Funcionalidades**

- Listar os jogos da equipe em ordem de data e horário.
- Destacar o próximo jogo.
- Exibir modalidade, equipes participantes, data, horário e local.
- Abrir os detalhes de um jogo.
- Identificar jogos que tiveram horário ou local alterados.
- Disponibilizar os dados previamente sincronizados sem internet.

**Regras**

- O responsável visualizará os jogos vinculados à sua equipe.
- A agenda deverá apresentar a última versão recebida do servidor.
- Sem conexão, a tela deverá informar que os dados podem estar desatualizados.
- Jogos com horário já passado continuarão disponíveis na lista, sem aparecer como próximo compromisso.

**Critério de aceite:** o responsável consegue identificar seu próximo jogo e consultar seus detalhes com ou sem conexão, após o download inicial.

### 5.4. Módulo administrativo de alteração de jogos

**Objetivo:** permitir que a organização publique mudanças na programação.

**Funcionalidades**

- Listar os jogos do evento.
- Selecionar um jogo para edição.
- Alterar data, horário ou local.
- Informar um motivo ou orientação complementar.
- Classificar a alteração como normal ou crítica.
- Revisar os dados antes de confirmar a publicação.

**Fluxo de alteração**

1. O administrador seleciona o jogo.
2. O sistema apresenta os dados atuais.
3. O administrador informa os novos dados e a prioridade.
4. A interface apresenta um resumo da alteração e das equipes afetadas.
5. Após a confirmação, o backend salva a alteração e gera o aviso.
6. Se a alteração for crítica, o backend solicita o SMS para os responsáveis das equipes afetadas.

**Regras**

- A edição exigirá conexão no MVP.
- Os campos obrigatórios deverão ser validados.
- O sistema deverá registrar o valor anterior, o novo valor, a data da alteração e o administrador responsável.
- Uma alteração em um jogo deverá comunicar todas as equipes participantes afetadas.
- A alteração e o aviso deverão ser salvos de forma consistente.
- Uma falha no SMS não poderá desfazer a atualização da agenda.
- Se o salvamento falhar, a interface não poderá informar que a alteração foi publicada.

**Critério de aceite:** uma alteração confirmada permanece salva, aparece na agenda e gera um aviso com os dados anteriores e atuais.

### 5.5. Módulo de avisos

**Objetivo:** centralizar os comunicados oficiais relevantes para cada equipe.

**Tipos de aviso**

| Tipo | Origem e comportamento |
|---|---|
| Manual | Criado pelo administrador, como uma orientação sobre chegada ao local. |
| Automático | Gerado pelo sistema após alteração de um jogo. |

**Funcionalidades**

- Publicar um aviso para todas as equipes ou para uma equipe específica.
- Informar título, mensagem e prioridade.
- Listar avisos do mais recente para o mais antigo.
- Exibir o conteúdo completo e a data de publicação.
- Destacar avisos críticos.
- Manter os avisos sincronizados disponíveis offline.

**Regras**

- A prioridade deverá aparecer em texto, além de qualquer indicação por cor.
- Os avisos automáticos deverão identificar o jogo e explicar o que mudou.
- Avisos críticos manuais também poderão solicitar SMS aos responsáveis destinatários.
- No MVP, avisos publicados não serão editados ou excluídos. Correções serão feitas por um novo comunicado.
- O recebimento de um aviso no aplicativo acontecerá na sincronização. Notificações push não serão obrigatórias nesta versão.

**Critério de aceite:** cada responsável visualiza os avisos gerais e os da sua equipe, incluindo os gerados por alterações de jogos.

### 5.6. Módulo de informações do evento e transporte

**Objetivo:** manter orientações essenciais acessíveis sem depender de mensagens externas.

**Funcionalidades**

- Consultar instruções gerais do evento.
- Consultar endereço e orientações de acesso aos locais.
- Consultar horário de transporte, ponto de embarque e destino da equipe.
- Acessar esse conteúdo offline após a sincronização.

**Escopo simplificado**

As informações serão previamente cadastradas no backend. Não será necessário criar um editor de conteúdo nem implementar mapas interativos.

As instruções essenciais deverão aparecer em texto dentro da aplicação. Um regulamento em arquivo poderá ser acrescentado se houver tempo, desde que seu download e sua abertura offline sejam verificados.

**Critério de aceite:** sem internet, o responsável consegue consultar onde embarcar, a que horas sair e qual é o destino informado para sua equipe.

### 5.7. Módulo de armazenamento offline

**Objetivo:** permitir a consulta das informações essenciais durante falhas de conexão.

**Dados armazenados no dispositivo**

- Identificação da equipe.
- Agenda e detalhes dos jogos.
- Avisos recebidos.
- Instruções do evento.
- Informações de transporte.
- Data e horário da última sincronização bem-sucedida.

**Comportamento esperado**

- Após uma sincronização, os dados deverão ser mantidos no dispositivo.
- Ao fechar e reabrir a aplicação sem conexão, o conteúdo deverá continuar acessível.
- Se ainda não houver dados salvos, a aplicação deverá explicar que é necessário um primeiro acesso conectado.
- Uma falha ao atualizar não deverá apagar a versão local disponível.
- Ao encerrar a sessão, os dados associados ao usuário deverão ser removidos ou deixar de ficar acessíveis a outra conta.

**Limite do MVP:** o funcionamento offline será somente para consulta. Edição administrativa e publicação de avisos exigirão conexão.

**Critério de aceite:** a aplicação reabre sem internet e permite consultar o conteúdo previamente sincronizado.

### 5.8. Módulo de sincronização

**Objetivo:** atualizar os dados locais com as informações oficiais do backend.

**Quando sincronizar**

- Após o acesso inicial.
- Ao abrir a aplicação com conexão, quando possível.
- Ao tocar no botão "Atualizar".

O MVP não precisará executar sincronização em segundo plano com a aplicação fechada.

**Funcionalidades**

- Consultar a versão dos dados disponíveis no servidor.
- Buscar os dados necessários à equipe.
- Atualizar os registros locais sem duplicar jogos ou avisos.
- Mostrar que uma atualização está em andamento.
- Registrar a data e o horário somente após concluir a sincronização.
- Informar falhas e permitir uma nova tentativa.

**Estratégia para o MVP**

Como o volume de dados será pequeno, será aceitável buscar um pacote completo da equipe quando houver uma nova versão disponível. A transferência apenas dos registros modificados poderá ficar para uma evolução posterior.

O servidor será a fonte oficial para agenda, avisos, instruções e transporte.

**Critério de aceite:** após uma mudança administrativa, o responsável toca em "Atualizar" e recebe a nova agenda e seu aviso, sem duplicidade.

### 5.9. Módulo de acompanhamento de SMS

**Objetivo:** apresentar ao administrador o resultado da integração desenvolvida no Tema 1.

**Funcionalidades**

- Associar cada solicitação ao aviso e ao destinatário.
- Mostrar o resultado disponível do envio.
- Exibir um motivo compreensível quando houver falha.
- Permitir nova tentativa manual em caso de falha, respeitando a prevenção de duplicidade.

**Regras**

- O frontend não chamará diretamente o provedor de SMS.
- Uma resposta de solicitação aceita será exibida como "Aceito para envio".
- O estado "Entregue" somente poderá aparecer se a integração fornecer essa confirmação.
- Recarregar a página ou atualizar a agenda não poderá disparar novos SMS.

**Critério de aceite:** o administrador consegue identificar se o SMS foi solicitado ou se ocorreu uma falha, sem confundir isso com confirmação de leitura.

---

## 6. Telas mínimas

| Tela | Conteúdo principal |
|---|---|
| Acesso | Entrada dos usuários de demonstração. |
| Início da equipe | Próximo jogo, avisos recentes, conexão e última sincronização. |
| Agenda | Lista e detalhes dos jogos da equipe. |
| Avisos | Lista de comunicados e leitura do conteúdo completo. |
| Informações | Instruções do evento e transporte. |
| Painel administrativo | Lista dos jogos e acesso à publicação de avisos. |
| Alteração de jogo | Campos de edição, prioridade e resumo antes de publicar. |
| Publicação de aviso | Título, mensagem, destinatários e prioridade. |

Os resultados de SMS poderão ser apresentados dentro do detalhe do aviso no painel administrativo, dispensando uma tela exclusiva.

## 7. Responsabilidades do frontend e do backend

| Camada | Responsabilidades |
|---|---|
| Frontend | Apresentar as telas, coletar entradas, exibir validações, armazenar dados locais, executar a sincronização e informar conexão, atualização e falhas. |
| Backend | Validar permissões e dados, persistir informações, identificar equipes afetadas, gerar avisos, disponibilizar dados para sincronização e solicitar SMS. |
| Integração de SMS | Processar a solicitação de mensagem e devolver os estados disponíveis do envio. |

As regras de acesso e a identificação dos destinatários deverão ser verificadas no backend.

## 8. Requisitos gerais de qualidade

- **Acessibilidade:** campos com identificação, navegação compreensível, bom contraste e informação que não dependa apenas de cores.
- **Persistência:** reiniciar o backend não poderá apagar alterações publicadas.
- **Consistência:** o mesmo jogo deverá manter seu identificador após mudanças de horário ou local.
- **Tratamento de falhas:** apresentar mensagens claras e preservar dados locais quando uma atualização falhar.
- **Proteção de credenciais:** senhas e chaves de serviços não deverão ficar expostas no frontend.
- **Adequação ao celular:** telas e controles deverão funcionar em dimensões de smartphone.
- **Rastreabilidade mínima:** alterações administrativas e solicitações de SMS deverão ter identificadores e datas de registro.

## 9. Funcionalidades fora do MVP

- Cadastro público e recuperação de senha.
- Envio e aprovação de documentos pessoais.
- Chat entre usuários.
- Rastreamento de transporte em tempo real.
- Mapas interativos e cálculo de rotas.
- Notificações push.
- Relatórios e indicadores avançados.
- Edição de dados sem internet.
- Sincronização com a aplicação fechada.
- Confirmação de leitura ou ciência dos avisos.
- Telas completas de cadastro de eventos, equipes e instituições.

## 10. Critérios de conclusão

O MVP estará pronto para apresentação quando:

1. Os dois perfis conseguirem acessar suas áreas.
2. O responsável visualizar somente a programação e os avisos pertinentes.
3. O administrador conseguir alterar um jogo.
4. A alteração gerar um aviso para as equipes afetadas.
5. Uma alteração crítica solicitar SMS aos responsáveis.
6. Uma falha no SMS não impedir a publicação da mudança.
7. A agenda, os avisos e as instruções continuarem acessíveis após reabrir a aplicação sem internet.
8. A interface informar a última sincronização e a condição offline.
9. Uma atualização conectada substituir os dados antigos pelos dados oficiais.
10. Atualizar ou recarregar a aplicação não duplicar avisos nem disparar novamente o mesmo SMS.

Se o SMS for simulado durante a apresentação, essa condição deverá estar explícita. Nesse caso, o fluxo demonstrará a integração prevista, mas o envio real permanecerá pendente de validação.
