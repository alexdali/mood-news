.PHONY: install setup dev worker ingest rewrite test e2e benchmark report check verify build docker-up docker-down reset clean

install:
	npm install

setup:
	cp -n .env.example .env || true
	npm run bootstrap

dev:
	npm run dev

worker:
	npm run worker

ingest:
	npm run ingest

rewrite:
	npm run rewrite

test:
	npm run test

e2e:
	npm run test:e2e

benchmark:
	npm run benchmark

report:
	npm run report

check:
	npm run check

verify:
	npm run verify:models

build:
	npm run build

docker-up:
	docker compose up --build

docker-down:
	docker compose down

reset:
	npm run db:reset -- --yes

clean:
	npm run clean
