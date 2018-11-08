// @flow

/* global describe, it, beforeEach */

const chai = require('chai');
const assert = chai.assert; 
const bluebird = require('bluebird');

const logger = require('winston');
logger.setLevels(logger.config.syslog.levels);

const db = require('../../../source/storage/database');

const config = require('../../../source/utils/config');  
const redis = require('redis').createClient(
  config.get('redis:port'),
  config.get('redis:host'), {});

describe('Redis Database', () => {
  describe('#deleteUser(username)', () => {
    describe('when given a user \'jsmith\'', () => {
      beforeEach((done) => {
        const info = {
          username: 'jsmith', email: 'jsmith@foo.bar'
        };
        db.setServerAndInfos('jsmith', 'someServer', info, done);
      });

      it('deletes the user', async () => {
        await db.deleteUser('jsmith');

        assert.isFalse(await redisExists('jsmith:users'), 'user info is gone');
        assert.isFalse(await redisExists('jsmith:server'), 'user server is gone');
        assert.isFalse(await redisExists('jsmith@foo.bar:email'), 'email link is gone');
      });
    });    
  });

  async function redisExists(key): Promise<boolean> {
    const res = await bluebird.fromCallback(
      cb => redis.exists(key, cb));

    return res === 1;
  }
});