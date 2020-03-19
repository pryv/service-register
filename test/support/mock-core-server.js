const url = require('url');
const express = require('express');
const app = express();

const config = require('../../source/config');

const serverUrl = url.parse(config.get('net:aaservers:mock-api-server')[0].base_url);
const port = serverUrl.port;

app.post('/register/create-user', (req, res) => {
  res.status(201)
    .json({
      id: 'something',
    });
});

app.listen(port, () => console.log(`Mock core server listening on port ${port}!`));