MOCHA=./node_modules/.bin/mocha
TEST_FILES=test/acceptance/*.js

test:
	@$(MOCHA) --timeout 1000 --reporter spec $(TEST_FILES)


test-detailed:
	@$(MOCHA) --timeout 300 --reporter spec $(TEST_FILES)

test-debug:
	@$(MOCHA) --timeout 3600000 --reporter spec --debug-brk $(TEST_FILES)

test-dns:
	@$(MOCHA) --timeout 5000 --reporter spec test/acceptance/dns.js

test-check:
	@$(MOCHA) --timeout 5000 --reporter spec test/acceptance/check.js

test-access:
	@$(MOCHA) --timeout 5000 --reporter spec test/acceptance/access.test.js

test-server:
	@$(MOCHA) --timeout 5000 --reporter spec test/acceptance/server.js

test-hostings:
	@$(MOCHA) --timeout 5000 --reporter spec test/acceptance/hostings.test.js

test-user:
	@$(MOCHA) --timeout 5000 --reporter spec test/acceptance/user.test.js

test-checkEmail:
	@$(MOCHA) --timeout 5000 --reporter spec test/acceptance/check-email.js

test-admin-users:
	@$(MOCHA) --timeout 5000 --reporter spec test/acceptance/admin-users.js

test-changeEmail:
	@$(MOCHA) --timeout 5000 --reporter spec test/acceptance/admin-changeEmail.test.js

load:
	@$(MOCHA) --timeout 50000 --reporter spec test/load/*.js

.PHONY: test
