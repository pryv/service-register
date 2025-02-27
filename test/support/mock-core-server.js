/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
const express = require('express');
const app = express();

const config = require('../../src/config');
const port = config.get('net:hostings:local-api-server:localhost:port');

app.post('/register/create-user', (req, res) => {
  res.status(201).json({
    id: 'something'
  });
});

app.listen(port, () =>
  console.log(`Mock core server listening on port ${port}!`)
);
