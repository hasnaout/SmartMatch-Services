import { Suspense, lazy } from "react";
import PageLoader from "../components/feedback/PageLoader";

/**
 * HOC pour le lazy loading des pages avec fallback loader.
 * @param {() => Promise} importFn — () => import("../pages/...")
 */
export function lazyLoad(importFn) {
  const Component = lazy(importFn);
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}