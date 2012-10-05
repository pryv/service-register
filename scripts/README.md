# How to spawn a master register

- Copy config file at: 
	register@reg-gandi-fr-01.pryv.net:/home/register/reg-gandi-fr-01.pryv.net.json

fleet deploy
./fleet-setup.bash reg-gandi-fr-01
./fleet-spawn-database.bash reg-gandi-fr-01 master
./fleet-spawn-register.bash reg-gandi-fr-01 /home/register/reg-gandi-fr-01.pryv.net.json


# How to spawn a slave dns
- Copy config file at: 
	register@reg-gandi-fr-02.pryv.net:/home/register/dns-gandi-fr-02.pryv.net.json

fleet deploy
./fleet-setup.bash reg-gandi-fr-02
./fleet-spawn-database.bash reg-gandi-fr-02 slave
./fleet-spawn-dns.bash reg-gandi-fr-02 /home/register/dns-gandi-fr-02.pryv.net.json