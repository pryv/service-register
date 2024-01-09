/**
 * @license
 * Copyright (C) 2012–2024 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
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
