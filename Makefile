MOCHA_COV=./node_modules/.bin/_mocha
MOCHA=./node_modules/.bin/mocha

ENVIRONMENT_VARIABLES = NODE_ENV=unittest

test:
	@$(ENVIRONMENT_VARIABLES) \
	$(MOCHA) --recursive -R spec -t 15000 test

installer:
	@$(ENVIRONMENT_VARIABLES) \
	$(MOCHA) test/shopifyInstaller

debug:
	@$(ENVIRONMENT_VARIABLES) \
	$(MOCHA) --debug-brk test

.PHONY: test debug
