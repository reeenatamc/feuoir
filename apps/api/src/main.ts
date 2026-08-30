import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app.module.js";
import { ZodExceptionFilter } from "./common/zod-exception.filter.js";

const DEFAULT_PORT = 3001;
const DEFAULT_CORS_ORIGINS = "http://localhost:5173";

function resolvePort(): number {
  const raw = process.env.PORT;
  if (!raw) return DEFAULT_PORT;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`PORT invalido: "${raw}". Debe ser un entero entre 1 y 65535.`);
  }
  return parsed;
}

function resolveCorsOrigins(): string[] {
  return (process.env.CORS_ORIGINS ?? DEFAULT_CORS_ORIGINS)
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");

  // Sin esto el frontend (otro origen) no puede llamar a la API desde el navegador.
  // Lista blanca explicita en vez de `origin: true`, que refleja cualquier origen.
  app.enableCors({
    origin: resolveCorsOrigins(),
    credentials: true
  });

  // ZodError -> 400 en vez de 500
  app.useGlobalFilters(new ZodExceptionFilter());

  // Cierra conexiones y corre los hooks onModuleDestroy ante SIGTERM/SIGINT
  app.enableShutdownHooks();

  await app.listen(resolvePort());
}

void bootstrap();
