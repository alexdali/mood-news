export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode = 500,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "CONFIGURATION_ERROR", 500, details);
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`, "NOT_FOUND", 404, { entity, id });
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 422, details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: unknown) {
    super(`${service}: ${message}`, "EXTERNAL_SERVICE_ERROR", 502, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class BudgetExceededError extends AppError {
  constructor(limit: number, spent: number) {
    super("Daily AI cost limit reached", "AI_BUDGET_EXCEEDED", 429, { limit, spent });
  }
}
