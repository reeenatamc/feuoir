# feuoir

E-commerce monorepo. The point of it is the API layout, not the shop.

## What is here

```
apps/web        React frontend, a Figma prototype taken to code
apps/api        NestJS backend, layered
packages/shared types and contracts both sides import
```

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
gateway means writing one adapter rather than touching the order flow.

```
POST /api/orders/:id/payment-attempts
```

## Running it

```bash
npm install
npm run dev
```

## Status

The API foundation is in place; the catalogue and checkout are not finished.

## Licence
MIT
