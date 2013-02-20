**TODO: review and integrate this into the README (check with Simon if needed)**

# Dev infos

## Staging registration page
https://sw.rec.la:2443/register/index-staging.html


## Init

- Add the following line to /etc/hosts
	
		127.0.0.1	reglocal.rec.la


## Setup 

for OS x user   
`scripts/dev/setup-environement-dev.sh` 

## Start

**Redis database**  
`scripts/dev/start-database-dev-sh`

to monitor the db  
`$ ../redis-2.4.8/src/redis-cli`  
`redis 127.0.0.1:6379> AUTH MyRecordedLife`  
`redis 127.0.0.1:6379> monitor`  

**Node**  
from `source/`   
check `dev-config.json` to see if it fits your system, and eventually make a modified copy in `local-config.json` (ignored by git)

run: `node app`


## very often you need to work on register and on the relative static web files.

checkout `git@github.com:pryv/static-web.git`and run it (look at it's own DEV_ENVIRONEMNT file)