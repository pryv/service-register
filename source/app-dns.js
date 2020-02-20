// @flow
const dns = require('./dns/ndns-wrapper');
const { serverForName } = require('./dns/server_for_name.js');

class DnsServer {
  config;

  constructor(config?: Object) {
    if(config == null) {
      this.config = require('./utils/config');
    } else {
      this.config = config;
    }
  }

  async start() {
    await dns.start('udp4', this.config.get('dns:port'), this.config.get('dns:ip'), serverForName);
    if (this.config.get('dns:ip6')) {
      await dns.start('udp6', this.config.get('dns:port'), this.config.get('dns:ip6'), serverForName);
    }
  }

  async close() {
    await dns.close();
  }
}

module.exports = DnsServer;
