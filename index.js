const express = require("express");
const WebSocket = require('ws');

const { createConnection, connectUser, connectOnExchange, createExchange } = require('./rabbitMethods')

const app = express();
const wss = new WebSocket.Server({ port: 8080 });

const PORT = process.env.PORT || 4001;

var connection, userChannels = {};

app.use(express.json());

app.get("/send-msg", (req, res) => {
    res.send("Hello world")
});

app.listen(PORT, async () => {
    connection = await createConnection()

    console.log("Server running at port " + PORT)
});

app.post('/connectUser', async (req, res) => {
    const { userId } = req.body;
    userChannels[userId] = await connectUser(connection)

    res.json({ success: true })
})

app.post('/createExchange', async (req, res) => {
    const { exchange, userId } = req.body;

    await createExchange(exchange, userChannels[userId])

    res.json({ success: true })
})

app.post('/connectOnExchange', async (req, res) => {
    const { userId, exchangeList } = req.body;

    // Assegurar que o canal do usuário foi criado
    if (!userChannels[userId]) {
        userChannels[userId] = await createChannel(connection); // Substitua pelo método correto para criar o canal
    }

    // Conectar a cada exchange na lista
    await Promise.all(exchangeList.map(async (item) => {
        await connectOnExchange(userId, item, userChannels[userId]);
    }));

    res.json({ success: true });
});
