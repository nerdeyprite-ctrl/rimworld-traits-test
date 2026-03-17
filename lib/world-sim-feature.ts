// Keep this as a plain constant so client bundles never depend on runtime env access.
export const WORLD_SIM_ENABLED = false;

export const isWorldSimEnabled = () => WORLD_SIM_ENABLED;

export const WORLD_SIM_DISABLED_ERROR = 'World simulation is temporarily disabled.';
