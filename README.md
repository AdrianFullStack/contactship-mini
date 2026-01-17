<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Descripción

Proyecto NestJS minimal que maneja leads, encolamiento de trabajos (`Bull`) y sincronización periódica (`Schedule`). Incluye integración con Redis (colas y caché) y TypeORM (Postgres).

## Requisitos

- Node.js 18+ y npm
- Redis (para Bull)
- Postgres (opcional si usas DB real)

Puedes levantar dependencias rápidas con Docker:

```bash
# Redis
docker run -d --name redis -p 6379:6379 redis:6

# Postgres (opcional)
docker run -d --name pg -e POSTGRES_PASSWORD=pass -e POSTGRES_USER=user -e POSTGRES_DB=app -p 5432:5432 postgres:13
```

## Instalación

```bash
npm install
```

## Variables de entorno recomendadas

- `PORT` (por defecto 3000)
- `LOG_LEVEL` (usa `debug` para ver `logger.debug`)
- `REDIS_HOST` (por defecto `localhost`)
- `REDIS_PORT` (por defecto `6379`)
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`, `DATABASE_SYNCHRONIZE`
 - `API_KEY` (clave utilizada por `ApiKeyGuard`, header: `x-api-key`)

Ejemplo rápido (macOS / Linux):

```bash
export LOG_LEVEL=debug
export REDIS_HOST=localhost
export REDIS_PORT=6379
export PORT=3000
```

## Ejecutar la aplicación

```bash
# modo desarrollo (con watch)
npm run start:dev

# producción (build previo)
npm run build && npm run start:prod
```

## Endpoints principales

Base: http://localhost:3000/api/v1

- POST `/leads` — Crear un lead
  - Body JSON: `{ "name": "Nombre", "email": "correo@ejemplo.com", "phone": "123" }`
- GET `/leads` — Listar leads
- GET `/leads/:id` — Obtener lead por id
- POST `/leads/:id/summarize` — Encolar job para generar resumen (procesado por `AIProcessor`)
 
Nota: los endpoints `POST` (`/leads`, `/leads/:id/summarize`) están protegidos por `ApiKeyGuard`. Debes enviar el header `x-api-key: <TU_API_KEY>` en esas peticiones.

### Curl listos para copiar/pegar

# Crear lead (envía `x-api-key` header)
```bash
curl -s -X POST http://localhost:3000/api/v1/leads \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"name":"Juan Pérez","email":"juan@example.com","phone":"555-1234"}' | jq
```

# Listar leads
```bash
curl -s http://localhost:3000/api/v1/leads | jq
```

# Obtener lead por id (reemplaza LEAD_ID)
```bash
curl -s http://localhost:3000/api/v1/leads/LEAD_ID | jq
```

# Encolar resumen (reemplaza LEAD_ID) — incluye `x-api-key`
```bash
curl -s -X POST http://localhost:3000/api/v1/leads/LEAD_ID/summarize \
  -H "x-api-key: YOUR_API_KEY" | jq
```

Nota: `jq` es opcional, solo mejora el formateo de JSON en terminal.

## Verificar queues y cron

- Asegúrate de tener Redis arriba y `REDIS_HOST`/`REDIS_PORT` correctamente configurados.
- Ajusta `LOG_LEVEL=debug` para ver los `logger.debug` en `SyncService` y `AIProcessor`.
- Al iniciar la app deberías ver logs periódicos del cron cada minuto y logs cuando se procesa un job en la cola.
- Si no ves logs, cambia temporalmente `logger.debug(...)` por `logger.log(...)` en `src/services/sync.service.ts` para comprobar ejecución.

## Levantar infra con Docker Compose (Redis + Postgres)

Se incluye `docker-compose.yml` en el repositorio para levantar Redis y Postgres rápidamente.

```bash
# Inicia Redis y Postgres en background
docker-compose up -d

# Ver logs
docker-compose logs -f
```

Hay un archivo `.env.example` con las variables de entorno recomendadas. Para desarrollo local (ejecutando la app en tu máquina) deja `REDIS_HOST=localhost` y `DATABASE_HOST=localhost` en tu `.env` y arranca la app con:

```bash
cp .env.example .env
export LOG_LEVEL=debug
npm run start:dev
```

Si quieres ejecutar la app dentro de Docker en la misma red que los servicios, cambia `REDIS_HOST=redis` y `DATABASE_HOST=postgres` en el `.env` y agrega un servicio `app` al `docker-compose.yml`.

## Tests

```bash
# unit tests
npm run test

# test específico
npx --no-install jest src/controllers/lead.controller.spec.ts --runInBand
```

## Notas rápidas

- El procesador `AIProcessor` está en `src/processors/ia.processor.ts` y consume la cola `ai-processing`.
- El cron está en `src/services/sync.service.ts` (execute cada minuto por `@Cron(CronExpression.EVERY_MINUTE)`).
- Si necesitas un escenario de integración con Redis/Postgres, usa Docker Compose o los comandos `docker run` arriba.

---

Si quieres, puedo:

- Añadir un `docker-compose.yml` ejemplo que levante Redis y Postgres para desarrollo.
- Añadir checks de salud o endpoints para ver el estado de la cola.

Dime qué prefieres y lo preparo.
