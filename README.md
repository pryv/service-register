# Synopsis

Pryv Register and DNS servers.

## Usage 

### Configuration 

To enable UDP6 add `ip6` value to the configuration, e.g. :

```
  "dns": {
    ...
    "ip": "127.0.0.1",
    "ip6": "::1",
    ...
  }
```

### Install

*Prerequisites*: Yarn v1+, Node v12+

Download dependencies: `yarn install`

Install Redis: `yarn setup`

### How to?

Start database: `yarn database`

Create distribution: `yarn release`

Transpile during development: `yarn watch`

Run tests: `yarn test`

Run Register and DNS servers: `yarn start`

## Other

Connect to the local database: `./scripts/connect-database-client.sh`
