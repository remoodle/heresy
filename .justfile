set shell := ["bash", "-lc"]

up-local:
	docker compose -f docker-compose-local.yml up --build -d

remove-restart:
    docker compose -f docker-compose-local.yml down -v
    docker compose -f docker-compose-local.yml up --build -d
