const url = require('url');
const express = require('express');
const app = express();

const config = require('../../source/config');

// TODO should I put port in the hostings or providers config?
const port = config.get('net:hostings:local-api-server:localhost:port');

app.post('/register/create-user', (req, res) => {
  res.status(201)
    .json({
      id: 'something',
    });
});

app.listen(port, () => console.log(`Mock core server listening on port ${port}!`));