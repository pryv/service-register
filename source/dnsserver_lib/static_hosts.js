module.exports = {
        "www.google.ga" : {
		"ip" : "127.0.0.1",
		"description" : "serveur google au gabon",
	},
	"!*.lo" : {
		"ip" : "127.0.0.1",
		"description" : "je suis le serveur local",
		"autority" : "dns.{name},dns2.{name}",
		"mail" : {
			"ip" : "127.0.0.2",
			"name" : "mail.{name}",
			"priority" : 10
		},
		"nameserver" : [{
			"ip" : "127.0.0.1",
			"name" : "ns1.{name}"
		}]
	},
	"edelwatch.com" : {
		"ip" : "127.0.0.2",
		"description" : "Edel Watch web server",
		"autority" : "dns.{name},dns2.{name}",
		"mail" : {
			"ip" : "www.perki.com",
			"name" : "perki.{name}",
			"priority" : 10
		},
		"nameserver" : [{
			"ip" : "127.0.0.1",
			"name" : "ns1.{name}"
		}]
	},
	"perki.edelwatch.com" : {
		"alias" : {
			"name" : "www.perki.com"
		},
		"description" : "hello Perki"
		
	},
        "!*.edelwat.ch" : 'dynamic',
	"local.osh" : {
		"ip" : "127.0.0.1",
		"description" : "je suis le serveur local",
		"autority" : "dns.{name},dns2.{name}",
		"mail" : {
			"ip" : "127.0.0.2",
			"name" : "mail.{name}",
			"priority" : 10
		},
		"nameserver" : [{
			"ip" : "127.0.0.1",
			"name" : "ns1.{name}"
		},{
			"ip" : "127.0.0.1",
			"name" : "dns1.{name}"
		}]
	}
};