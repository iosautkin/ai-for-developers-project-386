/**
 * Production HTTP process entrypoint.
 *
 * The module owns no durable state itself. It builds the application from environment-provided
 * paths and starts one listener on the configured port and stable all-interface host.
 */

/** Default port used when PORT is not configured. */
export const DEFAULT_SERVER_PORT = 3_000;

/** Host binding required for local containers and production Docker. */
export const SERVER_HOST = '0.0.0.0';

/** Starts the production HTTP listener after migrations have succeeded. */
export type StartServer = () => Promise<void>;
