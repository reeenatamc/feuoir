import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { ZodError } from "zod";

/**
 * Los controllers validan con `schema.parse()`, que lanza `ZodError`.
 * Sin este filtro Nest no reconoce esa excepcion y responde **500 Internal
 * Server Error** ante un body invalido: el cliente no puede distinguir
 * "mandaste mal los datos" de "se cayo el servidor", y el error se registra
 * como falla del servidor.
 */
interface HttpResponse {
  status(code: number): HttpResponse;
  json(body: unknown): unknown;
}

@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter<ZodError> {
  catch(exception: ZodError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<HttpResponse>();

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      error: "Bad Request",
      message: "Datos de entrada invalidos",
      issues: exception.issues.map((issue) => ({
        path: issue.path.join("."),
        code: issue.code,
        message: issue.message
      }))
    });
  }
}
