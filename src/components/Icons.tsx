const p = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const IconHome = () => (
  <svg viewBox="0 0 24 24" {...p} aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>
);
export const IconBudget = () => (
  <svg viewBox="0 0 24 24" {...p} aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9v9z" /><path d="M15 3.5A9 9 0 0 1 20.5 9H15z" /></svg>
);
export const IconScan = () => (
  <svg viewBox="0 0 24 24" {...p} strokeWidth={2.2} aria-hidden="true"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10" /></svg>
);
export const IconGoals = () => (
  <svg viewBox="0 0 24 24" {...p} aria-hidden="true"><path d="M3 20l6-11 4 6 3-4 5 9z" /><path d="M15 4v5M15 4l4 1.5L15 7" /></svg>
);
export const IconList = () => (
  <svg viewBox="0 0 24 24" {...p} aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg>
);
export const IconUser = () => (
  <svg viewBox="0 0 24 24" {...p} aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
);
export const IconBack = () => (
  <svg viewBox="0 0 24 24" {...p} strokeWidth={2.4} aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
);
export const IconPlus = () => (
  <svg viewBox="0 0 24 24" {...p} strokeWidth={2.4} aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
);
export const Logo = ({ size = 40, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ color }}>
    <path d="M6 50 L22 20 L32 34 L42 12 L58 50" fill="none" stroke="currentColor" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M42 12 V2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M42 2 L52 5.5 L42 9 Z" fill="#3EE6A8" />
  </svg>
);
