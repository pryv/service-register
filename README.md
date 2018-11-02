# Synopsis

Pryv Register and DNS servers.

## Usage 

### Install

*Prerequisites*: Yarn v1+, Node v8+

Download dependencies: `yarn install`

Install Redis: `yarn setup`

### How to?

Start database: `yarn database`

Create distribution: `yarn release`

Transpile during development: `yarn watch`

Run tests: `yarn test`

Run Register and DNS servers: `yarn start`

## Database

Connect to the local database: `./scripts/connect-database-client.sh`

### Delete user

In the redis-cli, run:

```
- hgetall <user>:users
- del <email>:email
- del <user>:server
- del <user>:users
```
