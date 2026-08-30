# feuoir

E-commerce monorepo. The point of it is the API layout, not the shop.

## What is here

```
apps/web        React frontend, a Figma prototype taken to code
apps/api        NestJS backend, layered
packages/shared types and contracts both sides import
```

Package manager is **npm workspaces**; `package-lock.json` is committed and CI
installs from it with `npm ci`.

## The API

Each module is split into `domain`, `application`, `infrastructure` and
`presentation`, so the business rules never import a framework and can be tested
without one.

Two decisions carry most of the weight:

**Order state is separate from payment state.** An order that is confirmed and a
payment that has not cleared are different facts, and collapsing them into one
status field is where this kind of system usually starts to rot.

**Payments go through a port.** `PaymentProviderPort` is an interface; the
current implementation happens to be WhatsApp-based, and swapping in a real
gateway means writing one adapter rather than touching the order flow. The port
carries its own `name`, so the provider recorded on an attempt is whichever
adapter is wired in, not a hardcoded string.

Input is validated with Zod at the controller edge, and `ZodError` is translated
to HTTP 400 by a global filter — without it Nest reports a malformed body as a
500 and the client cannot tell bad input from a broken server.

| Method | Path | |
|---|---|---|
| `GET`  | `/api/health` | Healthcheck |
| `POST` | `/api/orders` | Create an order |
| `POST` | `/api/orders/:id/payment-attempts` | Create a payment attempt |

## Running it

```bash
npm install

npm run dev:web     # Vite      → http://localhost:5173
npm run dev:api     # NestJS    → http://localhost:3001/api

npm run typecheck   # web + api
npm run build       # web + api
```

## Configuration

Each app ships a `.env.example`. Copy it and fill it in:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

Anything prefixed `VITE_` is inlined verbatim into the public browser bundle, so
only public values belong there. The Supabase `service_role` key never goes in
the frontend.

## Status

So that this file does not promise more than the code delivers:

- **No persistence.** The API repositories are in-memory
  (`InMemoryOrderRepository`, `InMemoryPaymentAttemptRepository`); everything is
  lost on restart. There is no database schema.
- **The frontend does not use the API.** `apps/web` talks to Supabase directly;
  the `apps/api` endpoints have no consumer yet.
- **No authentication on the API.** The endpoints are public.
- **No tests.** Neither app has a runner configured.
- **The cart does not persist**, does not handle quantities, and cannot drop
  items.
- **The admin "Orders" tab shows the local cart** of whoever is looking at it,
  not the shop's real orders — there is no `orders` table behind it.

## Licence

Proprietary. All rights reserved.

No licence is granted to use, copy, modify or distribute this code. The
repository being readable does not make it reusable.
