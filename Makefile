PVM_DIR := $(HOME)/.pvm

.PHONY: install uninstall link dev help

help: ## Show help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install pvm to ~/.pvm
	@echo "Installing pvm..."
	@mkdir -p $(PVM_DIR)/bin $(PVM_DIR)/versions $(PVM_DIR)/cache
	@cp -r bin src package.json package-lock.json node_modules $(PVM_DIR)/
	@cat > $(PVM_DIR)/bin/pvm << 'WRAPPER'
#!/usr/bin/env bash
exec node "$(dirname "$0")/../bin/pvm.js" "$$@"
WRAPPER
	@chmod +x $(PVM_DIR)/bin/pvm
	@cp scripts/pvm.sh $(PVM_DIR)/pvm.sh
	@echo ""
	@echo "  ✓ pvm installed to $(PVM_DIR)"
	@echo ""
	@echo "  Add this to your ~/.zshrc (or ~/.bashrc):"
	@echo ""
	@echo '    export PVM_DIR="$$HOME/.pvm"'
	@echo '    [ -s "$$PVM_DIR/pvm.sh" ] && source "$$PVM_DIR/pvm.sh"'
	@echo ""
	@echo "  Then restart your terminal or run: source ~/.zshrc"

uninstall: ## Remove pvm from ~/.pvm (keeps installed PHP versions)
	@echo "Removing pvm..."
	@rm -f $(PVM_DIR)/bin/pvm
	@rm -f $(PVM_DIR)/pvm.sh
	@rm -rf $(PVM_DIR)/bin/pvm.js $(PVM_DIR)/src $(PVM_DIR)/node_modules
	@echo "  ✓ pvm removed. PHP versions in $(PVM_DIR)/versions/ were kept."

link: ## Symlink for local development
	@mkdir -p $(PVM_DIR)/bin $(PVM_DIR)/versions $(PVM_DIR)/cache
	@ln -sf $(CURDIR)/bin/pvm.js $(PVM_DIR)/bin/pvm.js
	@ln -sf $(CURDIR)/src $(PVM_DIR)/src
	@ln -sf $(CURDIR)/node_modules $(PVM_DIR)/node_modules
	@ln -sf $(CURDIR)/package.json $(PVM_DIR)/package.json
	@cat > $(PVM_DIR)/bin/pvm << 'WRAPPER'
#!/usr/bin/env bash
exec node "$(dirname "$0")/../bin/pvm.js" "$$@"
WRAPPER
	@chmod +x $(PVM_DIR)/bin/pvm
	@cp scripts/pvm.sh $(PVM_DIR)/pvm.sh
	@echo "  ✓ pvm linked for development"

dev: ## Run pvm from source (pass args with ARGS=)
	@node bin/pvm.js $(ARGS)
