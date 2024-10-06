const { createConnection, connectUser, connectOnExchange, createExtendIfNotExists } = require('./rabbitMethods')

var usersChannel = {}
const exchangeName = "conversa01"

async function newConnectionUser(userId, connectionRabbit) {
    if (!usersChannel[userId]) {
        usersChannel[userId] = await connectUser(connectionRabbit)
    }

    const channel = usersChannel[userId]

    createExtendIfNotExists(exchangeName, channel)

    connectOnExchange(userId, exchangeName, channel)
}



createConnection()
    .then((connection) => {
        const amountConnections = 3

        for (let i = 0; i < amountConnections; i++) {
            newConnectionUser(i.toString(), connection)
        }
    })
