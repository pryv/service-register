# service-register

Register and DNS servers for Pryv.io.

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


## Contributing

### Todo 
- update docker pryvio/base1.8.1 to base1.9.0 (or latest)
- realease github workflow has been archived in `archives` it needs to rewritten to publish on dockerHub

### Installation

Prerequisites: [Node.js](https://nodejs.org/en/download/) 16, [just](https://github.com/casey/just#installation)

Then:
1. `just setup-dev-env`
2. `just install` to install node modules

Running `just` with no argument displays the available commands (defined in `justfile`).


## Testing

```
just test [...params]
```
- Extra parameters at the end are passed on to [Mocha](https://mochajs.org/) (default settings are defined in `.mocharc.js`)
- Replace `test` with `test-detailed`, `test-debug`, `test-cover` for common presets


## License

[BSD-3-Clause](LICENSE)
