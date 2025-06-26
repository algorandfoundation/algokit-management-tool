import { createRootRoute, Outlet, redirect } from "@tanstack/react-router";
import { Layout } from "../components/layout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import ErrorPage from "@/components/error-page";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  loader: () => {
    if (window.location.pathname === "/") {
      redirect({
        to: "/overview",
        throw: true,
      });
    }
  },
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <ErrorBoundary fallback={<ErrorPage />}>
          <Suspense fallback={<div>Loading...</div>}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </Layout>
    </QueryClientProvider>
  ),
});
