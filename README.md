# Pryv registration API server

Pryv user registration server component.

## Usage (ubuntu)

### Install (ubuntu)
```
git clone https://github.com/pryv/service-register
cd service-register  
apt-get install -y nodejs redis-server npm  
npm install  
```

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

Run `yarn install` to download the dependencies.

### Starting up Redis (Mac)

`./scripts/start-database.sh` in a separate terminal tab/window.

To monitor the db:

```
scripts/connect-database-client.sh
redis 127.0.0.1:6379> monitor
```

### Run service-register locally

run `yarn run start` to start 

## Tests

TODO


## Coding conventions

See the [Pryv guidelines](https://pryv.github.io/guidelines/).


## Deployment (Pryv-specific)

TODO

