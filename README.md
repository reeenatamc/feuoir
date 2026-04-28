# Feuoir Monorepo

Base escalable para e-commerce con frontend React y backend NestJS.

## Estructura

- `apps/web`: frontend actual (prototipo Figma llevado a codigo).
- `apps/api`: backend modular con enfoque SOLID.
- `packages/shared`: tipos/contratos compartidos.

## API Foundation

El backend quedo preparado para crecer sin refactor fuerte:

- Separación por capas (`domain`, `application`, `infrastructure`, `presentation`).
- Estado de orden separado de estado de pago.
- Contrato de proveedor de pago (`PaymentProviderPort`) con implementacion inicial WhatsApp.
- Endpoint payment-ready: `POST /api/orders/:id/payment-attempts`.

## Base de datos

Prisma schema inicial en `apps/api/prisma/schema.prisma` con:

- Catalogo: `Product`, `ProductVariant`, `InventoryItem`.
- Clientes: `Customer`, `Address`.
- Carrito: `Cart`, `CartItem`.
- Ordenes: `Order`, `OrderItem`, `OrderAddress`, `OrderEvent`.
- Pagos: `PaymentAttempt` para soportar WhatsApp hoy y gateway real despues.

## Comandos

```bash
npm install
npm run dev:web
npm run dev:api
```

Para Prisma:

```bash
cd apps/api
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
```
