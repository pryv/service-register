# rec∙la registration API server


Node.js / Express server to manage user registration requests.
TODO: update this README after code and file structure review.


## Setting up the development environment on a Mac

Read, then execute `./scripts/setup-environment-dev.sh`.


## Deploying with fleet: cheat sheet

1. `fleet deploy` to push current branch (note: must be master!) to all fleet drones
2. `./scripts/fleet-setup-<target>.sh` to setup the target server
3. `fleet stop <process id>` to stop previous instances (use `fleet ps` to list running processes)
4. `/scripts/fleet-spawn-<target>.sh` to start the new instances


## Folder structure

- `db`: config and scripts for the database (Redis)
- `misc-scripts`: some helper scripts
- `source`: TODO: detail structure...


## Debugging

[Using Eclipse for debugging](https://github.com/joyent/node/wiki/Using-Eclipse-as-Node-Applications-Debugger)


## Coding conventions

Coding conventions are in the general 'project' repository.
