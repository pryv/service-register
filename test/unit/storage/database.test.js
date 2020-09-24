// @flow

/* global describe, it, beforeEach */

const chai = require('chai');
const assert = chai.assert; 
const bluebird = require('bluebird');
const lodash = require('lodash');

const logger = require('winston');
logger.setLevels(logger.config.syslog.levels);

const db = require('../../../source/storage/database');

const config = require('../../../source/config');  
const redis = require('redis').createClient(
  config.get('redis:port'),
  config.get('redis:host'), {});

import type { UserInformation } from '../../../source/storage/users';

function userFixture(attrs): UserInformation {
  const baseAttributes = {
    username: 'baseUserName', password: '01234',
    language: 'de', invitationToken: 'foobar',
  };

  return lodash.merge({}, attrs, baseAttributes);
}

describe('Redis Database', () => {
  describe('#deleteUser(username)', () => {
    describe('when given a user \'jsmith\'', () => {
      beforeEach((done) => {
        const info = userFixture({
          username: 'jsmith', email: 'jsmith@foo.bar'
        });
        db.setServerAndInfos('jsmith', 'someServer', info, ['email'], done);
      });

      it('deletes the user', async () => {
        await db.deleteUser('jsmith');

        assert.isFalse(await redisExists('jsmith:users'), 'user info is gone');
        assert.isFalse(await redisExists('jsmith:server'), 'user server is gone');
        assert.isFalse(await redisExists('jsmith@foo.bar:email'), 'email link is gone');
      });
    });    
  });

  describe('#setServerAndInfos', () => {
    describe('when given user "foobar"', () => {
      const info = userFixture({
        username: 'a wrong initial value',
        email: 'A@B.CH',
      });

      // Call setServerAndInfos for 'foobar' - setup a user
      beforeEach((done) => {
        db.setServerAndInfos('foobar', 'server_XYZ', info, ['email'], done);
      });      

      it('stores user information', async () => {
        assert.isTrue(
          await redisExists('foobar:users')
        );

        const storedInfo = await bluebird.fromCallback(cb => redis.hgetall('foobar:users', cb));

        assert.strictEqual(storedInfo.username, 'foobar');
        assert.strictEqual(storedInfo.email, 'a@b.ch');
      });
      it('stores email index', async () => {
        const emailIndex = await bluebird.fromCallback(
          cb => redis.get('a@b.ch:email', cb));

        assert.strictEqual(emailIndex, 'foobar');
      });
      it('stores server name', async () => {
        const serverName = await bluebird.fromCallback(
          cb => redis.get('foobar:server', cb));

        assert.strictEqual(serverName, 'server_XYZ');
      });
      it('is hygienic with respect to parameters', () => {
        // After the call to setServerAndInfos, the input attributes should 
        // not have changed. 
        assert.strictEqual(info.email, 'A@B.CH');
      });
    });
    it('lower cases email when storing it in redis (key)', async () => {
      const info = userFixture({
        email: 'A@B.CH',
      });
      await bluebird.fromCallback(cb => 
        db.setServerAndInfos('foobar', 'server', info, ['email'], cb));
      
      assert.isTrue(
        await redisExists('a@b.ch:email')
      );
    });
    it('lower cases email when storing it in redis (info)', async () => {
      const info = userFixture({
        email: 'A@B.CH',
      });
      await bluebird.fromCallback(cb =>
        db.setServerAndInfos('foobar', 'server', info, ['email'], cb));

      const storedInfo = await bluebird.fromCallback(
        cb => redis.hgetall('foobar:users', cb));
      assert.strictEqual(storedInfo.email, 'a@b.ch');
    });
  });
  describe('#emailExists(email, cb)', () => {
    const info = userFixture({
      username: 'a wrong initial value',
      email: 'A@B.CH',
    });

    // Call setServerAndInfos for 'foobar' - setup a user
    beforeEach((done) => {
      db.setServerAndInfos('foobar', 'server_XYZ', info, ['email'], done);
    });      

    it('is case insensitive for email', async () => {
      assert.isTrue(
        await bluebird.fromCallback(
          cb => db.emailExists('A@B.ch', cb)));
    });
  });
  describe('#getUIDFromMail(email, cb)', () => {
    const info = userFixture({
      username: 'a wrong initial value',
      email: 'A@B.CH',
    });

    // Call setServerAndInfos for 'foobar' - setup a user
    beforeEach((done) => {
      db.setServerAndInfos('foobar', 'server_XYZ', info, ['email'], done);
    });

    it('is case insensitive for email', async () => {
      const uid = await bluebird.fromCallback(
        cb => db.getUIDFromMail('a@B.CH', cb));

      assert.strictEqual(uid, 'foobar');
    });
  });
  
  describe('Reservations', () => {
    const info = userFixture({
      key: 'User@pryv.com',
      core: 'A@B.CH',
    });
    const randomFieldValue = 'abc';
    const now = Date.now();

    it('#getReservation(key, core, time, cb)', async () => {
      // manually save reservation
      const multi = redis.multi();
      multi.hmset(`email-reservations:${info.key}`, {
        "core": info.core,
        "time": now
      });
      multi.hmset(`randomfield-reservations:${randomFieldValue}`, {
        "core": info.core,
        "time": now
      });
      await bluebird.fromCallback(cb => multi.exec(cb));

      // get reservation
      const storedReservation = await db.getReservations({
        email: info.key,
        randomfield: randomFieldValue,
      });
      assert.equal(storedReservation.length, 2);
      assert.equal(storedReservation[0].core, 'A@B.CH');
      assert.equal(storedReservation[0].time, now);

      assert.equal(storedReservation[1].core, 'A@B.CH');
      assert.equal(storedReservation[1].time, now);
    });

    it('#setReservation(key, core, time, cb)', async () => {
      // save reservation
      await db.setReservations({
        email: info.key,
        RandomKey: randomFieldValue,
      }, info.core, now);

      // retrieve reservations
      const storedReservation1 = await bluebird.fromCallback(cb =>
        db.getSet(`email-reservations:${info.key}`, cb));
      assert.equal(storedReservation1.core, info.core);
      assert.equal(storedReservation1.time, now);

      const storedReservation2 = await bluebird.fromCallback(cb =>
        db.getSet(`RandomKey-reservations:${randomFieldValue}`, cb));
      assert.equal(storedReservation2.core, info.core);
      assert.equal(storedReservation2.time, now);
    });
  });

  async function redisExists(key): Promise<boolean> {
    const res = await bluebird.fromCallback(
      cb => redis.exists(key, cb));

    return res === 1;
  }
});