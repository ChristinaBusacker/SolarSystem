/* eslint-disable @typescript-eslint/no-explicit-any */
// A tiny frameworkless router.
//
// 2026-ish decision:
// - Prefer the Navigation API when available (cleaner interception / future-proof).
// - Fallback to History API + popstate.

export type AppRoute =
  | { name: "home" }
  | { name: "planet"; planet: string }
  | { name: "moon"; moon: string }
  | { name: "cinematic" };

type Listener = (route: AppRoute) => void;

function normalizeBodyName(name: string): string {
  // Historical naming mismatch in the project.
  if (name === "Neptun") return "Neptune";
  return name;
}

function buildUrl(route: AppRoute): string {
  if (route.name === "home") return "/";
  if (route.name === "cinematic") return "/cinematic";
  if (route.name === "planet") {
    return `/planet/${encodeURIComponent(normalizeBodyName(route.planet))}`;
  }
  return `/moon/${encodeURIComponent(normalizeBodyName(route.moon))}`;
}

function parseUrl(urlLike: string): AppRoute {
  const url = new URL(urlLike, window.location.origin);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (path === "/cinematic") return { name: "cinematic" };

  // /planet/Earth
  let m = path.match(/^\/planet\/([^/]+)$/);
  if (m) {
    const planet = decodeURIComponent(m[1]);
    return { name: "planet", planet: normalizeBodyName(planet) };
  }

  // /moon/Titan
  m = path.match(/^\/moon\/([^/]+)$/);
  if (m) {
    const moon = decodeURIComponent(m[1]);
    return { name: "moon", moon: normalizeBodyName(moon) };
  }

  return { name: "home" };
}

function supportsNavigationApi(): boolean {
  return typeof (window as any).navigation !== "undefined";
}

export class AppRouter {
  private listeners = new Set<Listener>();
  private current: AppRoute = { name: "home" };
  private started = false;
  private usingNavigationApi = false;

  public start(): void {
    if (this.started) return;
    this.started = true;

    // Initial route (Navigation API does not emit on first load).
    this.commit(parseUrl(window.location.href));

    if (supportsNavigationApi()) {
      this.usingNavigationApi = true;
      const navigation = (window as any).navigation;

      navigation.addEventListener("navigate", (event: any) => {
        if (!event?.canIntercept) return;
        if (event.hashChange) return;
        if (event.downloadRequest != null) return;
        if (event.formData) return;

        const url = new URL(event.destination.url);
        if (url.origin !== window.location.origin) return;

        const route = parseUrl(url.href);
        event.intercept({
          focusReset: "manual",
          scroll: "manual",
          handler: () => {
            this.commit(route);
          },
        });
      });

      return;
    }

    window.addEventListener("popstate", () => {
      this.commit(parseUrl(window.location.href));
    });
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.current);
    return () => this.listeners.delete(listener);
  }

  public getCurrent(): AppRoute {
    return this.current;
  }

  public goHome(opts?: { replace?: boolean }): void {
    this.navigate({ name: "home" }, opts);
  }

  public goPlanet(planet: string, opts?: { replace?: boolean }): void {
    this.navigate({ name: "planet", planet }, opts);
  }

  public goMoon(moon: string, opts?: { replace?: boolean }): void {
    this.navigate({ name: "moon", moon }, opts);
  }

  public goCinematic(opts?: { replace?: boolean }): void {
    this.navigate({ name: "cinematic" }, opts);
  }

  private navigate(route: AppRoute, opts?: { replace?: boolean }): void {
    // Keep internal route state consistent with URL normalization.
    const normalized: AppRoute =
      route.name === "planet"
        ? { name: "planet", planet: normalizeBodyName(route.planet) }
        : route.name === "moon"
          ? { name: "moon", moon: normalizeBodyName(route.moon) }
          : route;

    const url = buildUrl(normalized);
    const replace = !!opts?.replace;

    if (this.usingNavigationApi) {
      const navigation = (window as any).navigation;
      navigation.navigate(url, replace ? { history: "replace" } : undefined);
      return;
    }

    if (replace) window.history.replaceState({}, "", url);
    else window.history.pushState({}, "", url);

    this.commit(normalized);
  }

  private commit(route: AppRoute): void {
    // Avoid noisy updates.
    const same =
      route.name === this.current.name &&
      (route.name === "home" ||
        route.name === "cinematic" ||
        (route.name === "planet" &&
          this.current.name === "planet" &&
          route.planet === this.current.planet) ||
        (route.name === "moon" &&
          this.current.name === "moon" &&
          route.moon === this.current.moon));

    if (same) return;

    this.current = route;
    this.listeners.forEach(l => l(route));
  }
}

export const router = new AppRouter();
