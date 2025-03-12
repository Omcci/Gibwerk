.PHONY: help install dev build up down clean logs test env-setup restart purge rebuild

# Colors for terminal output
GREEN := \033[0;32m
NC := \033[0m # No Color

help: ## Show this help menu
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@awk '/^[a-zA-Z\-\_0-9]+:/ { \
		helpMessage = match(lastLine, /^## (.*)/); \
		if (helpMessage) { \
			helpCommand = substr($$1, 0, index($$1, ":")-1); \
			helpMessage = substr(lastLine, RSTART + 3, RLENGTH); \
			printf "  ${GREEN}%-15s${NC} %s\n", helpCommand, helpMessage; \
		} \
	} \
	{ lastLine = $$0 }' $(MAKEFILE_LIST)

## Environment commands
env-setup: ## Set up environment files
	@echo "${GREEN}Setting up environment files...${NC}"
	@if [ ! -f .env ]; then \
		echo "Creating .env file..."; \
		echo "ANTHROPIC_API_KEY=your_anthropic_api_key_here" > .env; \
	fi
	@echo "${GREEN}Environment files setup complete${NC}"

## Development commands
install: env-setup ## Install dependencies for both frontend and backend
	@echo "${GREEN}Installing frontend dependencies...${NC}"
	cd frontend && npm install
	@echo "${GREEN}Installing backend dependencies...${NC}"
	cd backend && npm install

dev: env-setup ## Start development servers
	@echo "${GREEN}Starting development servers...${NC}"
	docker compose up postgres -d
	cd frontend && npm run dev & cd backend && npm run start:dev

## Docker commands
build: env-setup ## Build all Docker images
	@echo "${GREEN}Building Docker images...${NC}"
	docker compose build

up: env-setup ## Start all Docker containers
	@echo "${GREEN}Starting Docker containers...${NC}"
	docker compose up -d

down: ## Stop all Docker containers
	@echo "${GREEN}Stopping Docker containers...${NC}"
	docker compose down

restart: down up ## Restart all containers
	@echo "${GREEN}Containers restarted successfully${NC}"

rebuild: down ## Rebuild and restart containers
	@echo "${GREEN}Rebuilding and restarting containers...${NC}"
	docker compose build --no-cache
	docker compose up -d

clean: ## Stop containers and remove volumes
	@echo "${GREEN}Cleaning up Docker resources...${NC}"
	docker compose down -v
	docker system prune -f

purge: ## Remove all Docker resources including images
	@echo "${GREEN}Removing all Docker resources...${NC}"
	docker compose down -v
	docker system prune -af --volumes
	@echo "${GREEN}All Docker resources have been removed${NC}"

## Utility commands
logs: ## Show logs from all containers
	@echo "${GREEN}Showing Docker logs...${NC}"
	docker compose logs -f

test: ## Run tests for both frontend and backend
	@echo "${GREEN}Running frontend tests...${NC}"
	cd frontend && npm test
	@echo "${GREEN}Running backend tests...${NC}"
	cd backend && npm test

## Database commands
db-migrate: ## Run database migrations
	@echo "${GREEN}Running database migrations...${NC}"
	cd backend && npm run typeorm migration:run

db-reset: ## Reset the database
	@echo "${GREEN}Resetting database...${NC}"
	docker compose down postgres -v
	docker compose up postgres -d

## Production commands
prod-build: env-setup ## Build for production
	@echo "${GREEN}Building for production...${NC}"
	docker compose -f docker-compose.yml build

prod-up: env-setup ## Start production containers
	@echo "${GREEN}Starting production containers...${NC}"
	docker compose -f docker-compose.yml up -d

prod-down: ## Stop production containers
	@echo "${GREEN}Stopping production containers...${NC}"
	docker compose -f docker-compose.yml down

prod-restart: prod-down prod-up ## Restart production containers
	@echo "${GREEN}Production containers restarted successfully${NC}" 