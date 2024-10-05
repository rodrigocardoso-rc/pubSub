#!/usr/bin/env node

var amqp = require('amqplib/callback_api');

const numConsumers = 10; // Número de consumidores a serem simulados
const connection = {}
const userChannels = {}

amqp.connect('amqp://localhost', function(error0, connection) {
  if (error0) {
    throw error0;
  }

  // Função que cria um consumidor com uma fila exclusiva
  function createConsumer(id) {
    connection.createChannel(function(error1, channel) {
      if (error1) {
        throw error1;
      }
      console.log({channel})
      var exchange = 'cv1';
      channel.assertExchange(exchange, 'fanout', { durable: true });

      // Criar uma fila exclusiva para cada consumidor (nome da fila será gerado automaticamente)
      channel.assertQueue(`${id} - ${exchange}`, { exclusive: true, durable: true }, function(error2, q) {
        if (error2) {
          throw error2;
        }

        console.log(` [*] Consumer ${id} waiting for messages in ${q.queue}.`);

        // Vincular essa fila exclusiva ao exchange 'logs'
        channel.bindQueue(q.queue, exchange, '');

        // Consumir mensagens dessa fila exclusiva
        channel.consume(q.queue, function(msg) {
          if (msg.content) {
            console.log(` [Consumer ${id}] Received: ${msg.content.toString()}`);
          }
        }, { noAck: true });
      });
    });
  }

  // Criar 10 consumidores, cada um com uma fila exclusiva
  for (let i = 1; i <= numConsumers; i++) {
    createConsumer(i);
  }
});

function createUser() {

}
