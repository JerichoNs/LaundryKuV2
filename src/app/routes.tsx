import { createBrowserRouter } from "react-router";
import { PlatformSelector } from "./components/PlatformSelector";
import { AdminMobileApp } from "./components/admin/AdminMobileApp";
import { AdminDesktopApp } from "./components/admin/AdminDesktopApp";
import { CustomerMobileApp } from "./components/customer/CustomerMobileApp";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: PlatformSelector,
  },
  {
    path: "/admin-mobile",
    Component: AdminMobileApp,
  },
  {
    path: "/admin-desktop",
    Component: AdminDesktopApp,
  },
  {
    path: "/customer-mobile",
    Component: CustomerMobileApp,
  },
]);
