# Logging

Production-ready logging for the rent management API using **Pino** (no third-party logging services). Structured, readable, and safe for financial data (no sensitive info).

## Configuration

- **Module:** `src/config/logger.ts`
- **Environment:** `NODE_ENV=development` → console with pino-pretty; `NODE_ENV=production` → rotating file + stdout.
- **Level:** `LOG_LEVEL` (default: `debug` in dev, `info` in prod).
- **Log directory:** `LOG_DIR` (default: `logs/` under project root).

### Named loggers

Use the same pattern everywhere:

```ts
import { getLogger } from '../config/logger';
const log = getLogger('payments');  // or 'app' | 'api' | 'payments'
log.info({ msg: '...', event: 'payment_created', ... });
```

- **app** – Startup, DB connection, unhandled errors.
- **api** – Request/response (method, path, status, duration, requestId) via middleware.
- **payments** – Payment created/applied/reversed, charge adjustments, validation/transaction failures.

## Where log files are placed

| Environment | Location | Contents |
|-------------|----------|----------|
| **Production** | `logs/app.log` | All logs (info and above). |
| **Production** | `logs/error.log` | Errors only. |
| **Development** | stdout only | Pretty-printed (no files). |

- Default path: **`<project_root>/logs/`** (e.g. `express-app/logs/`).
- Override with **`LOG_DIR`** (e.g. `/var/log/rentis`).
- `logs/` is in `.gitignore`; do not commit log files.
- **Rotation:** Pino does not rotate files. Use system logrotate or a process manager (e.g. PM2) to rotate `app.log` and `error.log`.

### Example logrotate config

```text
/var/log/rentis/app.log /var/log/rentis/error.log {
  daily
  rotate 14
  compress
  delaycompress
  missingok
  notifempty
}
```

## Middleware

- **File:** `src/middleware/logging.middleware.ts`
- Adds **request_id** (UUID) and **requestStartTime** to `req`.
- On response finish, logs: **method**, **path**, **statusCode**, **durationMs**, **userContext** (placeholder `single-admin` or authenticated user). Does **not** log request bodies.

## Example logs

### Application startup (app logger)

```json
{"level":"info","logger":"app","time":"2025-02-10T12:00:00.000Z","msg":"Application startup","event":"startup","port":3000,"env":"development"}
```

### API request (api logger, after response)

```json
{"level":"info","logger":"api","time":"2025-02-10T12:00:01.000Z","msg":"Request completed","requestId":"a1b2c3d4-...","method":"POST","path":"/api/payments","statusCode":201,"durationMs":45,"userContext":"single-admin"}
```

### Payment created (payments logger)

```json
{"level":"info","logger":"payments","time":"2025-02-10T12:00:01.000Z","msg":"Payment created","event":"payment_created","paymentId":"...","tenantId":"...","amount":500,"chargesAffected":2,"advanceAmount":50,"success":true}
```

### Charge adjustment (payments logger)

```json
{"level":"info","logger":"payments","time":"2025-02-10T12:00:01.000Z","msg":"Charge adjustment","event":"charge_adjustment","paymentId":"...","chargeId":"...","residentId":"...","beforePaidAmount":0,"afterPaidAmount":250,"statusChange":"PENDING -> PARTIAL","appliedAmount":250}
```

### Payment application failure (payments logger)

```json
{"level":"error","logger":"payments","time":"2025-02-10T12:00:02.000Z","msg":"Payment application failed","event":"payment_apply_failure","paymentId":"...","residentId":"...","amount":100,"success":false,"error":"Connection lost"}
```

### Unhandled exception (app logger)

```json
{"level":"error","logger":"app","time":"2025-02-10T12:00:03.000Z","msg":"Unhandled exception","error":"...","stack":"..."}
```

## What is logged (mandatory)

| Area | Events | Logger |
|------|--------|--------|
| **Startup** | App startup (port, env), DB connected / connection failure | app |
| **API** | Method, path, status, durationMs, requestId, userContext | api |
| **Payments** | Payment created, amount, tenantId, chargesAffected, advanceAmount, success/failure | payments |
| **Charge adjustments** | chargeId, before/after paidAmount, status change (apply + reversal) | payments |
| **Errors** | Validation errors, transaction failures, unhandled exceptions | app / payments |

## What is not logged

- Full request or response bodies (to avoid leaking PII or secrets).
- Passwords, tokens, or authorization headers (redacted by logger config).
- Every ORM/query (minimal noise).

## Passing errors to the global handler

Route handlers that use `async` should catch errors and call `next(err)` so the global error handler can log them:

```ts
export async function someHandler(req: Request, res: Response, next: NextFunction) {
  try {
    // ...
  } catch (err) {
    next(err);
  }
}
```

Payment create/remove already catch and log via the payments logger and send 500 responses.
