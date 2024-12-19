import { createRootRoute, Outlet, redirect } from "@tanstack/react-router";
import { Layout } from "../components/layout";

export const Route = createRootRoute({
  loader: () => {
    if (window.location.pathname === "/") {
      redirect({
        to: "/metrics",
        throw: true,
      });
    }
  },
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});
