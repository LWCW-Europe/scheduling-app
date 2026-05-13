.PHONY: help dev build start lint typecheck lint-watch test test-unit test-integration test-watch test-coverage test-e2e test-e2e-ci format format-check check-and-format dev-migrate-up dev-migrate-status dev-migrate-create dev-db-reset dev-admin install clean clean-all

SHELL := /bin/bash

help:
	@echo "Available commands:"
	@echo ""
	@echo "Development:"
	@echo "  make dev              Start development server"
	@echo "  make dev-admin        Run admin CLI"
	@echo "  make check-and-format Format, lint, typecheck, and run all tests (incl. e2e)"
	@echo ""
	@echo "Building:"
	@echo "  make build            Build for production"
	@echo "  make start            Start production server"
	@echo ""
	@echo "Testing:"
	@echo "  make test             Run all unit and integration tests"
	@echo "  make test-unit        Run unit tests only"
	@echo "  make test-integration Run integration tests only"
	@echo "  make test-e2e         Run E2E tests (headed, for local dev)"
	@echo "  make test-e2e-ci      Run E2E tests (headless)"
	@echo "  make test-watch       Run unit and integration tests in watch mode"
	@echo "  make test-coverage    Run unit and integration tests with coverage"
	@echo ""
	@echo "Linting & Formatting:"
	@echo "  make lint             Run linter"
	@echo "  make lint-watch       Run linter in watch mode"
	@echo "  make typecheck        Run TypeScript type checking"
	@echo "  make format           Format code"
	@echo "  make format-check     Check code formatting"
	@echo ""
	@echo "Database:"
	@echo "  make dev-migrate-up   Run migrations"
	@echo "  make dev-migrate-status Check migration status"
	@echo "  make dev-migrate-create Generate new migration"
	@echo "  make dev-db-reset     Reset development database"
	@echo ""
	@echo "Dependencies:"
	@echo "  make install          Install dependencies"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean            Remove dev and build artifacts as well as test output"
	@echo "  make clean-all        Clean + remove node_modules"

install:
	bun install --frozen-lockfile

dev: install
	bun set-env.ts dev bun x next dev

build: install
	bun x next build

start: install
	bun set-env.ts production bun x next start

lint: install
	bun x eslint --max-warnings 0 .

typecheck: install
	bun x tsc --noEmit

lint-watch: install
	watchexec -c -w app -w db -w utils -w tests "bun x eslint --fix ."

test: install
	bun x vitest run

test-unit: install
	bun x vitest run tests/unit

test-integration: install
	bun x vitest run tests/integration

test-watch: install
	bun x vitest

test-coverage: install
	bun x vitest run --coverage

test-e2e: install
	bun set-env.ts test bun x playwright test --headed

test-e2e-ci: install
	bun set-env.ts test bun x playwright test

format: install
	bun x prettier --write .

format-check: install
	bun x prettier --check .

check-and-format: format lint typecheck test test-e2e-ci

clean:
	rm -rf .next
	rm -f next-env.d.ts
	rm -f data.db data.test.db
	rm -rf playwright-report test-results
	rm -f tsconfig.tsbuildinfo

clean-all: clean
	rm -rf node_modules

dev-migrate-up: install
	bun set-env.ts dev bun x drizzle-kit migrate

dev-migrate-status: install
	bun set-env.ts dev bun x drizzle-kit check

dev-migrate-create: install
	bun set-env.ts dev bun x drizzle-kit generate

dev-db-reset: install
	bun set-env.ts dev bun x tsx tests/e2e/reset-database.ts

dev-admin: install
	bun set-env.ts dev bun x tsx scripts/admin.ts
