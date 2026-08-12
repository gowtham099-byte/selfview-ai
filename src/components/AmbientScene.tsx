import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

const Scene3D = lazy(() => import("@/components/Scene3D"));

export function AmbientScene() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 opacity-50" aria-hidden>
      <ClientOnly fallback={null}>
        <Suspense fallback={null}>
          <Scene3D />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
