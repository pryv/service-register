MOCHA=./node_modules/.bin/mocha
TEST_FILES=test/acceptance/*.js

test:
	@$(MOCHA) --timeout 1000 --reporter spec $(TEST_FILES)

test-detailed:
	@$(MOCHA) --timeout 300 --reporter spec $(TEST_FILES)

test-debug:
	@$(MOCHA) --timeout 3600000 --reporter spec --debug-brk $(TEST_FILES)

test-bodyParser:
	@$(MOCHA) --timeout 5000 --reporter spec test/acceptance/bodyParser.js

test-confirm:
	@$(MOCHA) --timeout 5000 --reporter spec test/acceptance/confirm.js

test-server:
	@$(MOCHA) --timeout 5000 --reporter spec test/acceptance/server.js

test-init:
	@$(MOCHA) --timeout 5000 --reporter spec test/acceptance/init.js

test-check_email:
	@$(MOCHA) --timeout 5000 --reporter spec test/acceptance/check_email.js

test-changeEmail:
	@$(MOCHA) --timeout 5000 --reporter spec test/acceptance/admin_changeEmail.js

load:
	@$(MOCHA) --timeout 50000 --reporter spec test/load/*.js

.PHONY: test
