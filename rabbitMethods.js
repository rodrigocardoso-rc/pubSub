var amqp = require('amqplib/callback_api');

async function createConnection() {
    return new Promise((resolve, reject) => {
        try {
            amqp.connect('amqp://localhost', function (err, connection) {
                if (err) {
                    reject(err);
                }

                resolve(connection);
            });
        } catch (err) {
            reject(err);
        }
    })
}

async function connectUser(connection) {
    return new Promise((resolve, reject) => {
        try {
            connection.createChannel(function (err, channel) {
                if (err) {
                    throw err;
                }

                resolve(channel);
            })
        } catch (err) {
            reject(err);
        }
    })
}

async function createExchange(exchange, channel) {
    channel.assertExchange(exchange, 'fanout', { durable: true });
}

async function connectOnExchange(userId, exchange, channel) {
    channel.assertQueue(
        `${userId} - ${exchange}`,
        { exclusive: true, durable: true },
        (err, q) => {
            if (err) {
                throw err;
            }

            console.log(` [*] Consumer ${userId} waiting for messages in ${q.queue}.`);

            // Vincular essa fila exclusiva ao exchange 'logs'
            channel.bindQueue(q.queue, exchange, '');

            // Consumir mensagens dessa fila exclusiva
            channel.consume(q.queue, function (msg) {
                if (msg.content) {
                    console.log(` [Consumer ${userId}] Received: ${msg.content.toString()}`);
                }
            }, { noAck: true });
        });
}



module.exports = { createConnection, connectUser, connectOnExchange, createExchange }