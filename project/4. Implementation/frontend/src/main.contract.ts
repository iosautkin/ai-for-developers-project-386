/**
 * Application bootstrap module.
 *
 * Owns the single QueryClient and React root for the lifetime of the page. It locates the
 * application root, mounts global providers and the declarative router, and fails immediately
 * when the required root element is absent.
 */

/** DOM selector of the only element into which the React application may be mounted. */
export const APPLICATION_ROOT_SELECTOR = '#root';

/** Mounts providers and the declarative SPA router into the application root. */
export type MountApplication = () => void;
