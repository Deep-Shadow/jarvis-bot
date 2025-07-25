/**
  Este documento serve como um guia para desenvolvedores que desejam estender as funcionalidades do bot, adicionando novos comandos personalizados.
  
📍 Onde Encontrar as Funções do Bot?
    - As funções e utilitários que você pode usar para construir seus comandos estão organizados em dois arquivos principais no diretório src/utils/:

1. src/utils/functions.js
    - Este arquivo centraliza a maior parte da interação com o WhatsApp, como envio de mensagens, mídias (imagens, vídeos, áudios, stickers), reações, e manipulação de grupos.
    - Quando você acessa as funções dentro de um comando (dentro do switch-case em src/index.js), elas já estão disponíveis para você através do objeto functions retornado por loadCommandFunctions.
  
  * Exemplos de funções disponíveis aqui:
    - sendReply(text, mentions): Envia uma resposta à mensagem original.
    - sendImageFromURL(url, caption): Envia uma imagem a partir de uma URL.
    - downloadImage(webMessage): Baixa uma imagem de uma mensagem.
    - sendSuccessReact(): Envia um emoji de "✅" como reação.
    - isAdmin(userJid, remoteJid, socket): Verifica se um usuário é administrador do grupo.
    - ban(remoteJid, userJid): Bane um membro do grupo.
    - getGroupMetadata(): Obtém metadados do grupo.
    - isImage, isVideo, isReply, etc.: Variáveis booleanas que indicam o tipo da mensagem recebida.

2. src/utils/index.js
    - Este arquivo contém funções utilitárias diversas que ajudam na manipulação de dados, strings, números e outras tarefas auxiliares. Elas são importadas diretamente no src/index.js no topo do arquivo.
  
   * Exemplos de funções disponíveis aqui:
      - onlyNumbers(text): Extrai apenas números de uma string.
      - getRandomName(extension): Gera um nome de arquivo aleatório.
      - isLink(text): Verifica se uma string é um link.
      - toUserJid(number): Converte um número para um JID de usuário do WhatsApp.
      - getBuffer(url): Faz uma requisição HTTP e retorna os dados como um buffer.
      - removeAccentsAndSpecialCharacters(text): Remove acentos e caracteres especiais de uma string.

3. src/utils/database.js
    - Este arquivo gerencia a persistência de dados específicos de grupos, como ativar/desativar recursos (anti-link, boas-vindas, etc.). As funções deste arquivo são importadas e usadas diretamente em src/index.js para controlar o estado do bot por grupo.

  * Exemplos de funções disponíveis aqui:
    - activateAntiLinkGroup(groupId): Ativa o recurso anti-link para um grupo.
    - isActiveWelcomeGroup(groupId): Verifica se o recurso de boas-vindas está ativo em um grupo.
    - getAutoResponderResponse(match): Obtém uma resposta de auto-responder.

🛠️ Estrutura de um Novo Comando
    - Todos os comandos são definidos dentro da função startBot no arquivo src/index.js, utilizando uma estrutura switch-case baseada no command extraído da mensagem.

Siga este modelo para criar um novo comando:
*/
case "nome-do-comando": {
    /** 
     1. Verificações Iniciais (Permissões, Parâmetros, Tipo de Mensagem)
        - Sempre comece validando se o comando pode ser executado.
        - Use `if (!(await isAdmin(...)))`, `if (!args.length)`, `if (!isImage)`, etc.
        - Se uma condição não for atendida, lance um erro específico (DangerError, InvalidParameterError, WarningError).
    */
    if (!isGroup) {
        throw new WarningError("Este comando só pode ser usado em grupos.");
    }
    if (!(await isAdmin(userJid, remoteJid, socket))) {
        throw new DangerError("Você não tem permissão para usar este comando!");
    }
    if (!args.length) {
        throw new InvalidParameterError("Você precisa fornecer um argumento.");
    }

    // 2. Feedback Imediato ao Usuário (Reações/Mensagens de Aguarde)
    //    Use `sendWaitReact()` ou `sendWaitReply()` para indicar que o bot está processando.
    await sendWaitReact();
    // ou
    // await sendWaitReply("Estou processando seu pedido, aguarde...");

    // 3. Lógica Principal do Comando
    //    Aqui você implementa o que o comando realmente faz.
    //    Pode ser chamadas a APIs externas, manipulação de arquivos, cálculos, etc.
    const meuArgumento = fullArgs.trim();
    // Exemplo: Simular uma chamada a uma API
    // const resultadoAPI = await minhaNovaApiExterna(meuArgumento);
    const resultadoExemplo = `Você digitou: ${meuArgumento}`;

    // 4. **Resposta ao Usuário e Feedback Final**
    //    Use as funções de envio (`sendReply`, `sendText`, `sendImageFromURL`, etc.)
    //    e reações de sucesso/erro (`sendSuccessReact()`, `sendErrorReact()`).
    await sendSuccessReact();
    await sendReply(`O comando foi executado com sucesso! ${resultadoExemplo}`);

    // 5. **Obrigatório: `break;`**
    //    Sempre use `break;` para sair do `switch-case` após a execução do comando.
    break;
}

/**
💡 Quando Usar Qual Função?
Para decidir qual função usar, pense no que você quer fazer:

📥 Lidar com Mensagens Recebidas (functions object)
 * args: Array com os argumentos após o comando.
 * fullArgs: String completa de todos os argumentos.
 * body: Corpo completo da mensagem.
 * command: O comando detectado (sem o prefixo).
 * isImage, isVideo, isAudio, isSticker, isReply: Verifique o tipo da mensagem ou se é uma resposta para direcionar a lógica.
 * userJid: O JID (identificador do WhatsApp) do usuário que enviou a mensagem.
 * remoteJid: O JID do chat (grupo ou PV) onde a mensagem foi enviada.
 * webMessage: O objeto completo da mensagem Baileys, útil para debugging ou operações avançadas.
 
📤 Enviar Respostas e Mídia (functions object)
 * sendText(text, mentions): Para mensagens de texto simples.
 * sendReply(text, mentions): Para responder diretamente à mensagem do usuário.
 * sendImageFromURL(url, caption), sendImageFromFile(file, caption), sendImageFromBuffer(buffer, caption): Para enviar imagens.
 * sendVideoFromURL(url, caption), sendVideoFromFile(file, caption), sendVideoFromBuffer(buffer, caption): Para enviar vídeos.
 * sendAudioFromURL(url, asVoice), sendAudioFromFile(file, asVoice), sendAudioFromBuffer(buffer, asVoice): Para enviar áudios (com opção de "áudio como voz").
 * sendStickerFromURL(url), sendStickerFromFile(file), sendStickerFromBuffer(buffer): Para enviar figurinhas.
 * sendReact(emoji), sendSuccessReact(), sendWaitReact(), sendErrorReact(), sendWarningReact(): Para dar feedback visual com reações.
 * sendWaitReply(text), sendSuccessReply(text), sendErrorReply(text), sendWarningReply(text): Para mensagens de feedback com o prefixo e emoji do bot.

👥 Gerenciar Grupos (functions object)
 * getGroupMetadata(): Obter informações detalhadas do grupo.
 * getGroupAdmins(): Obter a lista de administradores do grupo.
 * ban(remoteJid, userJid): Remover um membro.
 * socket.groupParticipantsUpdate(remoteJid, [userJid], "promote"): Promover um membro a administrador.
 * socket.groupSettingUpdate(remoteJid, "announcement"): Fechar o grupo (apenas admins podem enviar mensagens).
 * socket.groupSettingUpdate(remoteJid, "not_announcement"): Abrir o grupo (todos podem enviar mensagens).

🧰 Utilitários Gerais (src/utils/index.js)
 * onlyNumbers(text): Limpar números de telefone.
 * getRandomName(extension): Gerar nomes únicos para arquivos temporários.
 * isLink(text): Verificar se um texto contém um link.
 * toUserJid(number): Converter um número para o formato de JID do WhatsApp.
 * delay(ms): Criar um atraso na execução.
 * isAdmin(userJid, remoteJid, socket) / isOwner(userJid, remoteJid, socket) / isBotOwner(userJid, remoteJid, socket): Para verificar permissões do usuário que enviou o comando.

💾 Interação com o Banco de Dados (src/utils/database.js)
 * activate...Group(groupId) / deactivate...Group(groupId): Para ativar/desativar recursos por grupo (anti-link, boas-vindas, etc.).
 * isActive...Group(groupId): Para verificar o status de um recurso em um grupo.
 * getAutoResponderResponse(match): Para buscar respostas configuradas no auto-responder.

⚠️ Tratamento de Erros
É crucial que seus comandos usem os erros personalizados definidos em src/errors.js para um tratamento consistente e mensagens claras para o usuário:
 * InvalidParameterError: Use quando o usuário fornecer parâmetros incorretos ou insuficientes para o comando.
   * Ex: throw new InvalidParameterError("Você precisa informar o texto!");
 * WarningError: Use para avisos ou condições que impedem a execução, mas não são erros graves de lógica (ex: "Link não é do YouTube!").
   * Ex: throw new WarningError("O link fornecido não é válido.");
 * DangerError: Use para erros que indicam falta de permissão ou problemas mais sérios na execução do comando.
   * Ex: throw new DangerError("Você não tem permissão para usar este comando!");
Qualquer outro erro que não seja uma instância dessas classes será capturado pelo try-catch principal e registrado no log de erros, enviando uma mensagem genérica de erro ao usuário.

🗑️ Gerenciamento de Arquivos Temporários
Se o seu comando baixar ou criar arquivos temporários (imagens, vídeos, etc.), é extremamente importante que você os exclua após o uso para evitar o acúmulo de lixo no sistema.
Use fs.unlinkSync(filePath) no bloco finally para garantir a limpeza, mesmo que ocorram erros:
try {
    const filePath = await downloadImage(webMessage);
    // ... sua lógica que usa filePath ...
} catch (error) {
    // ... tratamento de erro ...
} finally {
    // Garante que o arquivo temporário será deletado
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

Com este guia, você tem as ferramentas e o conhecimento da estrutura para começar a adicionar novas e emocionantes funcionalidades ao seu bot! Boas criações!
*/