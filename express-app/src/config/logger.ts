import pino from 'pino';
import path from 'path';
import fs from 'fs';

const isProd = process.env.NODE_ENV === 'production';
const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

const redactPaths = [
  'req.headers.authorization',
  'req.body.password',
  'req.body.token',
  '*.password',
  '*.token',
  '*.secret',
];

const baseOptions: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  redact: redactPaths,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

function createStream(): pino.DestinationStream {
  if (isProd) {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    return pino.multistream([
      {
        level: 'info',
        stream: pino.destination({
          dest: path.join(logDir, 'app.log'),
          append: true,
          mkdir: true,
        }),
      },
      {
        level: 'error',
        stream: pino.destination({
          dest: path.join(logDir, 'error.log'),
          append: true,
          mkdir: true,
        }),
      },
      { stream: process.stdout },
    ]);
  }
  return pino.transport({
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  }) as pino.DestinationStream;
}

const rootLogger = pino(baseOptions, createStream());

export type LoggerName = 'app' | 'api' | 'payments';

/**
 * Get a named logger for structured logging. Use consistent names: "app", "api", "payments".
 * Example: const log = getLogger("payments");
 */
export function getLogger(name: LoggerName): pino.Logger {
  return rootLogger.child({ logger: name });
}

export const appLogger = getLogger('app');
export const apiLogger = getLogger('api');
export const paymentsLogger = getLogger('payments');

export { rootLogger };
