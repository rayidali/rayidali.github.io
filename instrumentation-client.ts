/* Sentry, errors only, loaded after the page is idle. Errors thrown before that are buffered and forwarded. */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
type Early = { kind: "error" | "rejection"; value: unknown };
const early: Early[] = [];
if (typeof window !== "undefined" && dsn) {
  const onErr = (e: ErrorEvent) => { early.push({ kind: "error", value: e.error || e.message }); };
  const onRej = (e: PromiseRejectionEvent) => { early.push({ kind: "rejection", value: e.reason }); };
  window.addEventListener("error", onErr);
  window.addEventListener("unhandledrejection", onRej);
  const boot = () => import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({ dsn, sendDefaultPii: false, integrations: [] });
    window.removeEventListener("error", onErr);
    window.removeEventListener("unhandledrejection", onRej);
    early.splice(0).forEach((e) => Sentry.captureException(e.value));
    (window as any).__sentry = Sentry;
  }).catch(() => undefined);
  const w = window as any;
  if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(boot, { timeout: 4000 }); else setTimeout(boot, 2000);
}
export function onRouterTransitionStart() { /* tracing is off */ }
