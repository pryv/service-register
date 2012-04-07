test:
	@./node_modules/.bin/mocha --ignore-leaks \
                --reporter spec \
                --require should \
                --slow 20 \
                --timeout 5000 \
            test/acceptance/*.js 
            
load:
	@./node_modules/.bin/mocha --ignore-leaks \
                --reporter spec \
                --require should \
                --slow 20 \
                --timeout 5000 \
            test/load/*.js 

.PHONY: test