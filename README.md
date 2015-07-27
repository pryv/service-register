# Pryv registration API server

Pryv user registration server component.

**TODO: update and cleanup this document (see that of service core as an example)**


## Usage (ubuntu)

### Install (ubuntu)
git clone https://github.com/pryv/service-register; cd service-register  
apt-get install -y nodejs redis-server npm  
npm install  

### QuickRun (ubuntu)
service redis-server start  
redis-cli -a MyRecordedLife  # To monitor the db  
nodejs source/server.js  


## Operations on register

### Deleting a user

open redis console on reg-gandi-fr-01

- hgetall <user>:users
- del <email>:email
- del <user>:server
- del <user>:users


## Contribute (Mac)

### Setup the dev environment (Mac)

Read, then execute `./scripts/setup-dev-environment.bash`. It will check for Redis in the parent folder and install it if necessary.

### Starting up Redis (Mac)

`./scripts/start-database.sh` in a separate terminal tab/window.

To monitor the db:

```bash
scripts/connect-database-client.sh
redis 127.0.0.1:6379> monitor
```

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

