/**
 * Client-side logger for the PDF reader module.
 * Follows the same structured pattern as the server-side pino logger
 * but uses console.* since pino doesn't run in the browser.
 */

const PREFIX = "[pdf-reader]";

export const pdfLogger = {
  info(msg: string, data?: Record<string, unknown>) {
    if (data) {
      console.info(`${PREFIX} ${msg}`, data);
    } else {
      console.info(`${PREFIX} ${msg}`);
    }
  },
  warn(msg: string, data?: Record<string, unknown>) {
    if (data) {
      console.warn(`${PREFIX} ${msg}`, data);
    } else {
      console.warn(`${PREFIX} ${msg}`);
    }
  },
  error(msg: string, data?: Record<string, unknown>) {
    if (data) {
      console.error(`${PREFIX} ${msg}`, data);
    } else {
      console.error(`${PREFIX} ${msg}`);
    }
  },
};
