import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl" style={{ fontFamily: "Cormorant Garamond, serif", color: "#74367E" }}>404</h1>
        <h2 className="mt-4 text-xl font-medium">Page introuvable</h2>
        <p className="mt-2 text-sm" style={{ color: "rgba(26,26,26,0.55)" }}>
          Cette page n'existe pas ou a été déplacée.
        </p>
        <div className="mt-6">
          <Link to="/login" className="btn-primary">Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Une erreur est survenue</h1>
        <p className="mt-2 text-sm" style={{ color: "rgba(26,26,26,0.55)" }}>
          Veuillez réessayer.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="btn-primary"
          >
            Réessayer
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Boutique des Rêves" },
      { name: "description", content: "Système de gestion de locations de tenues traditionnelles et bijoux." },
      { name: "theme-color", content: "#74367E" },
      // Apple iOS PWA
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Boutique des Rêves" },
      // Windows / Edge
      { name: "msapplication-TileColor", content: "#74367E" },
      { name: "msapplication-tap-highlight", content: "no" },
      // General PWA
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "application-name", content: "Boutique des Rêves" },
    ],
    links: [
      // PWA manifest
      { rel: "manifest", href: "/manifest.json" },
      // Favicon
      { rel: "icon", href: "/icons/icon-96x96.png", type: "image/png", sizes: "96x96" },
      { rel: "icon", href: "/icons/icon-128x128.png", type: "image/png", sizes: "128x128" },
      { rel: "icon", href: "/icons/icon-192x192.png", type: "image/png", sizes: "192x192" },
      { rel: "icon", href: "/icons/icon-512x512.png", type: "image/png", sizes: "512x512" },
      { rel: "shortcut icon", href: "/BR-01.png", type: "image/png" },
      // Apple touch icon for iOS Safari
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      // Styles & Fonts
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=DM+Sans:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("SW registered with scope:", registration.scope);
          })
          .catch((error) => {
            console.error("SW registration failed:", error);
          });
      });
    }
  }, []);

  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ServiceWorkerRegistration />
      <Outlet />
    </QueryClientProvider>
  );
}
