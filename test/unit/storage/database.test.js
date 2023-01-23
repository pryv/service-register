// @flow

/* global describe, it, beforeEach */

const chai = require('chai');
const assert = chai.assert;
const bluebird = require('bluebird');
const lodash = require('lodash');
const faker = require('faker');

const logger = require('winston');
logger.setLevels(logger.config.syslog.levels);

const db = require('../../../src/storage/database');
const usersStorage = require('../../../src/storage/users');

const config = require('../../../src/config');
const redis = require('redis').createClient(
  config.get('redis:port'),
  config.get('redis:host'), {});

import type { UserInformation } from '../../../src/storage/users';

function userFixture(attrs): UserInformation {
  const baseAttributes = {
    username: 'baseUserName',
    password: '01234',
    language: 'de',
    invitationToken: 'foobar',
  };

  return lodash.merge({}, attrs, baseAttributes);
}

describe('Redis Database', () => {
  describe('#deleteUser(username)', () => {
    describe('user data should be deleted', () => {
      let info;
      let inactiveEmailValue = faker.lorem.word().toLowerCase();
      before(async () => {
        const username = faker.lorem.word().toLowerCase();
        info = userFixture({
          email: `${username}@foo.bar`,
          randomField: faker.lorem.word(),
        });
        info.username = username;
        await bluebird.fromCallback(cb =>
          db.setServerAndInfos(username,
            'someServer', info, ['email', 'randomField'], cb));

        // create some inactive events
        await usersStorage.updateFields(username, {
          email: [
            {
              value: inactiveEmailValue,
              isUnique: true,
              isActive: false,
              creation: true
            }
          ]
        }, {});

        // verify that unique and inactive fields exists before
        assert.isTrue(await redisExists(`${info.randomField}:randomField`), `before the tests, ${info.randomField}:randomfield exists`);
        assert.isTrue(await redisExists(`${info.email}:email`), `before the tests, ${info.email}:email exists`);
        const keys = await bluebird.fromCallback(cb =>
          redis.keys(`${username}:${db.INACTIVE_FOLDER_NAME}:*`, cb));
        assert.isTrue(keys.length > 0, `before the tests, ${username}:${db.INACTIVE_FOLDER_NAME} exists`);
      });

      it('[55G5] deletes the user', async () => {
        await db.deleteUser(info.username);
        assert.isFalse(await redisExists(`${info.username}:users`), 'user info is gone');
        assert.isFalse(await redisExists(`${info.username}:server`), 'user server is gone');
      });
      it('[G3FG] deletes user active unique fields', async () => {
        assert.isFalse(await redisExists(`${info.email}:email`), 'email link is gone');
        assert.isFalse(await redisExists(`${info.randomField}:randomfield`), 'randomField link is gone');
      });
      it('[777Y] deletes user non-active unique fields', async () => {
        const keys = await bluebird.fromCallback(cb =>
          redis.keys(`${info.username}:${db.INACTIVE_FOLDER_NAME}:*`, cb));
        assert.isFalse(await redisExists(`${inactiveEmailValue}:email`), 'inactive email link is gone');
        assert.isTrue(keys.length === 0, `after deletion, ${info.username}:${db.INACTIVE_FOLDER_NAME} doesn't exist`);
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
