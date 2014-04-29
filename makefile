MOCHA=NODE_ENV=development ./node_modules/.bin/mocha
APP_CONFIG=--server.ssl false
ifdef TEST
	TEST_FILES=test/$(TEST).test.js
else
	TEST_FILES=test/acceptance/*.test.js test/internal/*.test.js
endif

test:
	@$(MOCHA) --timeout 10000 --reporter dot $(APP_CONFIG) $(TEST_FILES)

test-detailed:
	@$(MOCHA) --timeout 1000 --reporter spec $(APP_CONFIG) $(TEST_FILES)

test-debug:
	@$(MOCHA) --timeout 3600000 --reporter spec --debug-brk $(APP_CONFIG) $(TEST_FILES)

test-load:
	@$(MOCHA) --timeout 50000 --reporter spec $(APP_CONFIG) test/load/*.js

.PHONY: test
