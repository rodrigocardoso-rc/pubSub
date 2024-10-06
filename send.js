var amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', function(err, connection) {
  if (err) {
    throw err;
  }

  connection.createChannel((err, channel) => {
    if (err) {
      throw err;
    }

    var exchange = 'conversa01';
    var content = process.argv.slice(2).join(' ') || '';

    const msgObj= {
      idMensagem: '1',
      idConversa: exchange,
      idUsuario: '1',
      nomeUsuario: 'Rogério',
      conteudo: content,
      dataHora: new Date()
    }

    channel.publish(exchange, '', Buffer.from(JSON.stringify(msgObj)));
    console.log(" [x] Sent %s", msgObj);
  });

  setTimeout(function() {
    connection.close();
    process.exit(0);
  }, 500);
});