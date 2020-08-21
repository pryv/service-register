const url = require('url');
const express = require('express');
const app = express();

const config = require('../../source/config');
const port = config.get('net:hostings:local-api-server:localhost:port');

app.post('/register/create-user', (req, res) => {
  res.status(201)
    .json({
      id: 'something',
    });
});

app.listen(port, () => console.log(`Mock core server listening on port ${port}!`));