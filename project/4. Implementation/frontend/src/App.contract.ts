import type { ComponentType } from 'react';

/**
 * Technical frontend shell shown before product screens are implemented.
 *
 * The component has no local state. It reads health as server state through the generated query
 * hook and renders mutually exclusive loading, ready and unavailable states with Mantine.
 */

/** React component contract for the technical application shell. */
export type AppComponent = ComponentType;
