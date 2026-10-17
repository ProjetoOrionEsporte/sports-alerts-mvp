# Roteiro de demonstração — Arena Connect

**Mensagem central:** mudou o jogo? A equipe fica sabendo, mesmo sem internet.

Links:

- Modo apresentação (projetor/notebook): https://arena-connect-prototipo.vercel.app/?demo=1
- App no celular: https://arena-connect-prototipo.vercel.app (QR code em `qr-arena-connect.png`)

Nada precisa ser instalado. Servidor e SMS do modo apresentação são simulados no navegador; a prova real usa SMS de verdade entre dois celulares.

---

## Parte 1 — Modo apresentação (1 minuto)

Abra o link `?demo=1` em tela cheia no notebook (largura mínima ~1180 px para os dois celulares lado a lado). Antes de começar, clique em **Reiniciar demonstração**.

| # | Celular | Ação | O que mostrar |
|---|---|---|---|
| 1 | Professor | Tocar em "Demonstração: simular perda de internet" | Barra fica "Sem internet": o professor está sem dados |
| 2 | Organização | Programação → #040 Chapecó × Itajaí → **Alterar jogo** → horário `14:30`, local **Arena Multiuso**, prioridade **Crítica** → Revisar → **Confirmar e publicar** | Resumo com antes/depois e equipes afetadas |
| 3 | Professor | — | **Alerta vermelho** (som + vibração) e agenda já em 14h30, Arena Multiuso, "Alterado" — sem internet |
| 4 | Organização | Avisos → aviso do #040 | Chapecó "Aceito para envio"; Itajaí "Falhou" (sem telefone) → **Tentar novamente**. O sistema não confunde "aceito" com "entregue" |
| 5 | Professor | Desligar a simulação → **Atualizar** | Dados oficiais do servidor, **sem duplicar** o aviso |

Pontos para falar:

- A mudança chega pela **rede celular (SMS)**, não por internet.
- A agenda fica **salva no aparelho**: fechar e reabrir sem internet continua mostrando tudo.
- Falha no SMS **não desfaz** a alteração publicada.

## Parte 2 — Prova real com SMS de verdade (opcional)

Dois celulares: **A = organização** (envia o SMS) e **B = professor** (Android com o app; recebe o SMS).

Preparação (com internet, minutos antes):

1. **B** abre https://arena-connect-prototipo.vercel.app e entra como **Rafael Souza (Professor)**. Isso salva o app e os dados no aparelho.
2. **A** abre o mesmo link e entra como **Mariana Costa (Administração)**.

Ao vivo:

1. **B** desliga **dados móveis e Wi-Fi** (sem internet), mas mantém o sinal de celular — não use modo avião, ele bloqueia SMS. Pode fechar o navegador.
2. **A** altera o jogo #040 com prioridade **Crítica** e publica.
3. Na tela "Alteração publicada", **A** toca em **Enviar SMS real por este celular**. Abre o app de mensagens com o texto pronto: escolher o contato de **B** e enviar.
4. **B** recebe o SMS (pela rede celular) e **toca no link**.
5. O app abre **sem internet**, mostra o alerta vermelho e a agenda atualizada.

Se **B** abrir o link com internet ligada, também funciona: o importante é que a mudança veio no SMS, não do servidor.

> Observação: no modo real cada celular tem seu próprio "servidor" de demonstração (não há backend compartilhado no protótipo). O dado chega ao professor pelo SMS, que é justamente o que se quer provar.

## Limites do protótipo (para responder perguntas)

- Backend, banco e provedor de SMS ainda são simulados; os textos e estados seguem a especificação (`docs/especificacao-mvp.md`).
- Leitura automática de SMS (sem tocar no link) só é possível em APK Android fora da loja; o código está em `app/modules/sms-inbox`, pausado.
- O alerta que toca sem app nenhum (Cell Broadcast, como a Defesa Civil) é exclusivo de operadoras e governo.

## Publicar uma nova versão

```
cd app
node scripts/deploy-web.mjs --prod
```
