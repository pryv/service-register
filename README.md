# Pryv registration API server

Pryv user registration server component.

**TODO: update and cleanup this document (see that of service core as an example)**


## Usage

### Starting up Redis

`./scripts/start-database.sh` in a separate terminal tab/window.

To monitor the db:

```bash
scripts/connect-database-client.sh
redis 127.0.0.1:6379> monitor
```


### Deleting a user

open redis console on reg-gandi-fr-01

- hgetall <user>:users
- del <email>:email
- del <user>:server
- del <user>:users


## Contribute

### Setup the dev environment

Read, then execute `./scripts/setup-dev-environment.bash`. It will check for Redis in the parent folder and install it if necessary.

TODO: review the following (probably obsolete and needs cleanup):

- Add the following line to `/etc/hosts`:	`127.0.0.1	reglocal.rec.la`
- Start: from `source/`, check `dev-config.json` to see if it fits your system, and eventually make a modified copy in `local-config.json` (ignored by git); then run: `node app`
- Very often you need to work on register and on the relative static web files: checkout `git@github.com:pryv/static-web.git` and run it (look at its DEV_ENVIRONMENT file)


## Tests

TODO


## Coding conventions

See the [Pryv guidelines](https://pryv.github.io/guidelines/).


## Deployment (Pryv-specific)

TODO

