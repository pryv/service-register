MOCHA=./node_modules/.bin/mocha
TEST_FILES=test/acceptance/*test.js

test:
	@$(MOCHA) --timeout 1000 --reporter spec $(TEST_FILES)

test-detailed:
	@$(MOCHA) --timeout 300 --reporter spec $(TEST_FILES)

test-debug:
	@$(MOCHA) --timeout 3600000 --reporter spec --debug-brk $(TEST_FILES)

test-app:
	@$(MOCHA) --timeout 3600000 --reporter spec  test/acceptance/app.test.js

test-dns:
	@$(MOCHA) --timeout 5000 --reporter spec test/acceptance/dns.test.js

test-access:
	@$(MOCHA) --timeout 5000 --reporter spec test/acceptance/access.test.js

test-server:
	@$(MOCHA) --timeout 5000 --reporter spec test/acceptance/server.test.js

test-hostings:
	@$(MOCHA) --timeout 5000 --reporter spec test/acceptance/hostings.test.js

test-user:
	@$(MOCHA) --timeout 5000 --reporter spec test/acceptance/user.test.js

test-email:
	@$(MOCHA) --timeout 5000 --reporter spec test/acceptance/email.test.js

test-system:
	@$(MOCHA) --timeout 5000 --reporter spec test/acceptance/system.test.js

test-admin:
	@$(MOCHA) --timeout 5000 --reporter spec test/acceptance/admin.test.js

load:
	@$(MOCHA) --timeout 50000 --reporter spec test/load/*.js

.PHONY: test
