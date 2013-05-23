# Pryv registration API server

Node.js / Express server to manage user registration requests.


## Setting up the development environment on a Mac

Read, then execute `./scripts/setup-dev-environment.bash`. It will check for Redis in the parent folder and install it if necessary.

TODO: review the following (probably obsolete and needs cleanup):

- Add the following line to `/etc/hosts`:	`127.0.0.1	reglocal.rec.la`
- Start: from `source/`, check `dev-config.json` to see if it fits your system, and eventually make a modified copy in `local-config.json` (ignored by git); then run: `node app`
- Very often you need to work on register and on the relative static web files: checkout `git@github.com:pryv/static-web.git` and run it (look at its DEV_ENVIRONMENT file)


## Starting up Redis

`./scripts/start-database.sh` in a separate terminal tab/window.

To monitor the db:

```bash
scripts/connect-database-client.sh
redis 127.0.0.1:6379> monitor
```


## Running the tests

TODO


## Debugging

TODO: update after folder structure is fixed.

`make test-debug` to attach your debugger of choice.

See also: [using Eclipse for debugging](https://github.com/joyent/node/wiki/Using-Eclipse-as-Node-Applications-Debugger)


## Deploying

TODO


## Folder structure

TODO: update after folder structure is fixed.

- `db`: config and scripts for the database (Redis)
- `misc-scripts`: some helper scripts
- `source`: ...


## Coding conventions

Coding conventions are [there](https://github.com/pryv/guidelines/). TODO: follow them!
