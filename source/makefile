test:
	@./node_modules/.bin/mocha --ignore-leaks \
                --reporter spec \
                --require should \
                --slow 20 \
                --timeout 5000 \
            test/acceptance/*.js 

test-bodyParser:
	@./node_modules/.bin/mocha --ignore-leaks \
                --reporter spec \
                --require should \
                --slow 20 \
                --timeout 5000 \
            test/acceptance/bodyParser.js 
            
test-confirm:
	@./node_modules/.bin/mocha --ignore-leaks \
                --reporter spec \
                --require should \
                --slow 20 \
                --timeout 5000 \
            test/acceptance/confirm.js 
            

test-server:
	@./node_modules/.bin/mocha --ignore-leaks \
                --reporter spec \
                --require should \
                --slow 20 \
                --timeout 5000 \
            test/acceptance/server.js 
            
load:
	@./node_modules/.bin/mocha --ignore-leaks \
                --reporter spec \
                --require should \
                --slow 20 \
                --timeout 50000 \
            test/load/*.js 

.PHONY: test
