# Pokemon REST API — CS5610 Mini Assignment

**Student:** Hang Liu  
**Stack:** Node.js, Hono, in-memory JavaScript array (no MongoDB required)

## Run locally

Install Node.js 20 or newer, then run:

```bash
npm install
npm run dev
```

Server: `http://localhost:3000`.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/pokemon` | List all Pokemon |
| GET | `/api/pokemon/:id` | Get one Pokemon |
| POST | `/api/pokemon` | Create Pokemon; random unique ID, health and level |
| PATCH | `/api/pokemon/:id` | Update specified fields |
| DELETE | `/api/pokemon/:id` | Delete Pokemon |

## Try the API

```bash
curl http://localhost:3000/api/pokemon
curl http://localhost:3000/api/pokemon/1
curl -X POST http://localhost:3000/api/pokemon -H "Content-Type: application/json" -d '{"species":"Eevee","owner":"Ash"}'
curl -X PATCH http://localhost:3000/api/pokemon/1 -H "Content-Type: application/json" -d '{"health":90,"level":8}'
curl -i -X DELETE http://localhost:3000/api/pokemon/1
```

POST requires non-empty `species` and `owner`; `name` defaults to `species`. POST generates ID, health, and level automatically (any provided health or level values are validated but replaced by generated values). PATCH accepts `name`, `species`, `owner`, `health`, and `level`. ID cannot be supplied or modified. Invalid requests return HTTP 400, missing Pokemon return HTTP 404, successful POST returns HTTP 201, and successful DELETE returns HTTP 204.

## Run tests

```bash
npm test
```

## Submission

Push this folder to a new GitHub repository. Submit the direct URL to `src/index.js` on Canvas before the next class.

**Note:** Data is stored only in memory and resets whenever the server restarts.
