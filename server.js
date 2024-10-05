const amqp = require('amqplib/callback_api');
const WebSocket = require('ws');
const url = require('url');

// Configurar o WebSocket Server
const wss = new WebSocket.Server({ port: 8080 });
const conversationChannels = {};
const conversationInfo = {};
const clientsPerConversation = {}; // Guardar os clientes por conversa

amqp.connect('amqp://localhost', (err, connection) => {
    if (err) {
        throw err;
    }

    connection.createChannel((err1, channel) => {
        if (err1) {
            throw err1;
        }

        wss.on('connection', (ws, req) => {
            const queryParams = url.parse(req.url, true).query;
            const { idConversa, nome, descricao, dataHoraCriacao } = queryParams;

            console.log(`Client connected to conversation: ${idConversa}`);

            // Inicializar a lista de WebSockets para essa conversa, se ainda não existir
            if (!clientsPerConversation[idConversa]) {
                clientsPerConversation[idConversa] = [];
            }
            clientsPerConversation[idConversa].push(ws);

            // Enviar os atributos da conversa assim que o cliente se conectar
            if (conversationInfo[idConversa]) {
                ws.send(JSON.stringify({
                    tipo: 'infoConversa',
                    idConversa: idConversa,
                    nome: conversationInfo[idConversa].nome,
                    descricao: conversationInfo[idConversa].descricao,
                    dataHoraCriacao: conversationInfo[idConversa].dataHoraCriacao
                }));
            } else {
                conversationInfo[idConversa] = {
                    idConversa: idConversa,
                    nome: nome,
                    descricao: descricao,
                    dataHoraCriacao: dataHoraCriacao
                }
            }

            // Se a fila dessa conversa ainda não tiver um consumidor, criar um
            if (!conversationChannels[idConversa]) {
                const queue = idConversa;

                // Criar a fila para a conversa
                channel.assertQueue(queue, { durable: true });

                // Consumir mensagens da fila e enviá-las para todos os WebSockets conectados
                channel.consume(queue, (msg) => {
                    const messageContent = msg.content.toString();

                    // Enviar a mensagem para todos os WebSockets conectados à conversa
                    clientsPerConversation[idConversa].forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(messageContent);
                        }
                    });
                }, { noAck: true });

                conversationChannels[idConversa] = queue;
            }

            // Quando uma nova mensagem for enviada por um cliente
            ws.on('message', (message) => {
                const { idConversa } = JSON.parse(message);

                // Enviar a mensagem para a fila correspondente
                channel.sendToQueue(conversationChannels[idConversa], Buffer.from(message));
            });

            // Quando um cliente desconectar, removê-lo da lista de WebSockets da conversa
            ws.on('close', () => {
                console.log(`Client disconnected from conversation: ${idConversa}`);
                clientsPerConversation[idConversa] = clientsPerConversation[idConversa].filter(client => client !== ws);
            });
        });
    });
});
