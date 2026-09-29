import type { NavigationAdapter } from "@expojet/schemas";
import type { Adapter } from "../contract.js";
import { routerNavigationAdapter } from "./expo-router.js";
import { reactNavigationAdapter } from "./react-navigation.js";

export { routerNavigationAdapter } from "./expo-router.js";
export { reactNavigationAdapter } from "./react-navigation.js";

const byId: Record<NavigationAdapter, Adapter> = {
  router: routerNavigationAdapter,
  "react-navigation": reactNavigationAdapter,
};

export function navigationAdapter(id: NavigationAdapter): Adapter {
  return byId[id];
}
