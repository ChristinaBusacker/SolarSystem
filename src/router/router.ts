// A tiny frameworkless router.
//
// Uses the navigation api if possible

export type AppRoute = { name: "home" } | { name: "planet"; planet: string };

type Listener = (route: AppRoute) => void;

function normalizePlanetName(name: string): string {
  if (name === "Neptun") return "Neptune";
  return name;
}

function buildUrl(route: AppRoute): string {
  if (route.name === "home") return "/";
  return `/planet/${encodeURIComponent(normalizePlanetName(route.planet))}`;
}

function parseUrl(urlLike: string): AppRoute {
  const url = new URL(urlLike, window.location.origin);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  // /planet/Earth
  const m = path.match(/^\/planet\/([^/]+)$/);
  if (m) {
    const planet = decodeURIComponent(m[1]);
    return { name: "planet", planet: normalizePlanetName(planet) };
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

  private navigate(route: AppRoute, opts?: { replace?: boolean }): void {
    const url = buildUrl(route);
    const replace = !!opts?.replace;

    if (this.usingNavigationApi) {
      const navigation = (window as any).navigation;
      navigation.navigate(url, replace ? { history: "replace" } : undefined);
      return;
    }

    if (replace) window.history.replaceState({}, "", url);
    else window.history.pushState({}, "", url);

    this.commit(route);
  }

  private commit(route: AppRoute): void {
    // Avoid noisy updates.
    if (
      route.name === this.current.name &&
      (route.name !== "planet" ||
        this.current.name !== "planet" ||
        route.planet === this.current.planet)
    ) {
      return;
    }

    this.current = route;
    this.listeners.forEach((l) => l(route));
  }
}

export const router = new AppRouter();
