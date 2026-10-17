# Parecer de viabilidade — Plataforma de comunicação para eventos multiesportivos

A solução é viável e atende boa parte da problemática, principalmente ao centralizar informações e permitir a consulta offline. Para atender ao desafio completo, é preciso detalhar quatro pontos: **sincronização, acessibilidade, transporte e confiabilidade dos alertas**.

O maior desafio não será criar as telas do aplicativo, mas garantir que cada equipe receba a informação correta e saiba quando os dados salvos podem estar desatualizados.

## 1. Ideia geral da aplicação

Uma plataforma de comunicação e gestão de informações para eventos multiesportivos, composta por um painel administrativo e um aplicativo para atletas e responsáveis pelas equipes.

A plataforma reunirá cronogramas, boletins oficiais, avisos, documentos e informações de transporte. Os dados essenciais serão armazenados no dispositivo para consulta sem internet e atualizados quando houver conexão.

Alterações urgentes poderão gerar notificações no aplicativo e SMS direcionados às equipes afetadas.

**Proposta de valor:** reduzir a dispersão das informações e a dependência de papel, mantendo as orientações essenciais disponíveis durante as falhas de conexão.

## 2. Perfis de usuário

É possível manter duas interfaces principais, mas recomendam-se três níveis de permissão:

| Perfil | Responsabilidades |
|---|---|
| Administrador do evento | Cadastrar instituições, equipes, modalidades, locais, cronogramas, boletins, documentos exigidos e avisos; acompanhar alterações e comunicações. |
| Instrutor ou responsável pela equipe | Consultar informações da equipe, atualizar documentos autorizados, acompanhar pendências e confirmar ciência de avisos críticos. |
| Atleta | Consultar sua programação, avisos, transporte e documentos pessoais; atualizar informações permitidas. |

Separar atleta e responsável evita, por exemplo, que qualquer integrante altere documentos de toda a equipe.

## 3. Funcionalidades propostas

### Organização do evento

- Cadastro de eventos, instituições, equipes, atletas e responsáveis.
- Associação das equipes às modalidades e categorias.
- Cadastro de locais de competição e alojamentos.
- Agenda de jogos e provas, com filtros por equipe, modalidade, data e local.
- Publicação de boletins oficiais, regulamentos e instruções.

### Comunicação

- Avisos gerais ou direcionados a determinadas equipes.
- Classificação de prioridade: informativo, importante e crítico.
- Notificações no aplicativo.
- SMS para alterações críticas de horário, local ou transporte.
- Histórico das alterações, com data e responsável.
- Confirmação de ciência pelo responsável da equipe.

### Documentação

Vale separar dois tipos de documento:

- **Documentos do evento:** regulamentos, boletins e orientações publicados pela organização.
- **Documentos de participantes:** arquivos enviados por atletas ou responsáveis, com acesso restrito.

Para os documentos de participantes, incluir envio, substituição e situação da análise: pendente, aprovado ou recusado com justificativa. Um arquivo salvo offline ainda não deve aparecer como recebido pela organização.

### Transporte

Essa parte aparece no desafio original, mas ainda está pouco desenvolvida na proposta:

- Horários de saída e retorno.
- Pontos de embarque e desembarque.
- Identificação das equipes atendidas.
- Destinos e instruções de deslocamento disponíveis offline.
- Alertas sobre mudanças no transporte.

Rastreamento de ônibus em tempo real pode ficar para uma etapa posterior.

### Acessibilidade

A acessibilidade precisa fazer parte da primeira versão:

- Compatibilidade com leitores de tela.
- Ajuste do tamanho do texto e contraste adequado.
- Botões com áreas de toque confortáveis.
- Avisos compreensíveis sem depender apenas de cores.
- Linguagem simples.
- Informações essenciais em texto, evitando depender exclusivamente de PDFs ou imagens.

## 4. Análise crítica: quanto a solução atende?

| Ponto da problemática | Avaliação |
|---|---|
| Informações espalhadas em papel e grupos | Atende, desde que a organização adote o sistema como canal oficial. |
| Consulta sem internet | Atende para informações previamente baixadas. |
| Atualizações de última hora | Atende parcialmente: dependem de internet ou cobertura celular para chegar ao usuário. |
| Sincronização inteligente | Ainda precisa ser especificada; salvar dados localmente é apenas uma parte. |
| Transporte | Precisa entrar explicitamente no escopo. |
| Acessibilidade digital | Precisa virar requisito verificável da aplicação. |
| Redução do papel | É possível, mas depende também da adesão dos participantes e da organização. |

O principal limite é que **informação disponível offline não significa informação atualizada**. Uma pessoa pode consultar um horário salvo sem saber que ele mudou. A interface precisa mostrar claramente a última sincronização e avisar quando estiver sem conexão.

## 5. Como o funcionamento offline deve acontecer

Recomenda-se que o aplicativo seja pensado desde o início para funcionar sem conexão:

1. Antes do evento, o usuário acessa sua conta e baixa o pacote de informações da equipe.
2. Cronogramas, instruções, documentos selecionados e transporte ficam disponíveis no dispositivo.
3. Sem internet, a consulta continua funcionando.
4. Alterações permitidas, como preparar um envio de documento, ficam em uma fila identificada como pendente.
5. Quando a conexão volta, o aplicativo transmite as pendências e busca as atualizações.

Para a sincronização ser "inteligente", o sistema deve:

- Baixar somente o que mudou.
- Priorizar avisos críticos e mudanças de programação.
- Evitar downloads repetidos de arquivos.
- Retomar transferências interrompidas.
- Evitar envios duplicados.
- Identificar versões antigas e conflitos.

Uma regra inicial simples: **cronogramas e avisos oficiais seguem a versão publicada pela organização; documentos enviados pelos usuários mantêm seu estado de envio e validação.**

Sobre o `localStorage`: ele não deve ser tratado como a solução completa de armazenamento. Para um aplicativo mobile, recomenda-se banco de dados local e armazenamento de arquivos. Em uma implementação web, IndexedDB e mecanismos de cache são opções mais adequadas para dados estruturados e conteúdo offline. A documentação da MDN sobre armazenamento local explica essa separação.

## 6. SMS: boa estratégia, com limites

A ideia do SMS é pertinente porque permite alertar quem está sem Wi-Fi ou dados móveis, desde que exista cobertura celular compatível com o recebimento de SMS.

Entretanto, o SMS:

- Não garante entrega imediata.
- Não resolve ausência total de sinal.
- Exige telefones corretos e atualizados.
- Tem custo operacional.
- Tem status de entrega que não comprova que o responsável leu e compreendeu a mensagem.

Serviços de SMS disponibilizam estados de envio e falha que podem alimentar um painel de acompanhamento. A documentação da Twilio exemplifica esse mecanismo.

Recomendação: cadastrar um responsável principal e um contato reserva por equipe, enviar SMS apenas para mudanças críticas e acompanhar a confirmação de ciência.

O SMS deve conter a informação necessária, sem obrigar o usuário a abrir um link:

```text
OLESC: jogo da equipe X alterado para 15h30 no Ginásio Y. Horário anterior: 14h. Publicado às 11h20.
```

Receber esse SMS, por si só, não atualiza a agenda salva no aplicativo. Na primeira versão, essa atualização pode ocorrer quando a internet retornar.

## 7. Possibilidade de implementação

A viabilidade técnica é alta, com complexidade moderada a alta para uma versão confiável em um evento real.

Uma estrutura possível:

| Componente | Função |
|---|---|
| Aplicativo mobile | Consulta, documentos, armazenamento offline e notificações. |
| Painel administrativo web | Cadastro e publicação das informações. |
| Servidor e banco central | Controle de usuários, permissões, versões e sincronização. |
| Armazenamento de arquivos | Documentos e boletins. |
| Serviço de comunicação | Envio de notificações e SMS, com acompanhamento de falhas. |

As partes mais trabalhosas serão sincronização, proteção dos documentos, segmentação dos avisos e testes em condições de conexão instável.

Como haverá documentos pessoais salvos nos aparelhos, o projeto também precisa prever controle de acesso, proteção do armazenamento e remoção dos dados ao encerrar a sessão ou quando não forem mais necessários.

## 8. Escopo recomendado para a primeira versão

Para um MVP — uma primeira versão funcional — a prioridade seria:

- Cadastro de evento, equipes e responsáveis.
- Cronograma por equipe.
- Boletins e instruções disponíveis offline.
- Avisos direcionados por equipe e prioridade.
- Horários e pontos de transporte.
- Sincronização com indicação da última atualização.
- SMS crítico para os responsáveis.
- Requisitos básicos de acessibilidade.

O envio e a análise de documentos pessoais podem entrar depois, salvo se forem obrigatórios para a avaliação do projeto. Essa funcionalidade amplia bastante o escopo sem ser o núcleo do problema de comunicação.

Antes de usar em grande escala, o piloto deve verificar se o aplicativo:

- Abre sem internet.
- Preserva dados após ser fechado.
- Sincroniza sem duplicar registros.
- Direciona alertas somente às equipes afetadas.

## 9. Parecer final

A proposta tem boa aderência ao desafio e é implementável. O diferencial deve ser a combinação de **informação oficial centralizada, consulta offline e atualização confiável**, apoiada por SMS em situações críticas.

Para um projeto acadêmico, um protótipo com esse fluxo completo e bem demonstrado será mais convincente do que muitas funcionalidades incompletas. Para uso real na OLESC, será necessário validar a solução com a organização e testar em um evento menor, incluindo conexão instável, falhas de entrega e mudanças simultâneas de programação.
