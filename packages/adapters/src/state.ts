import type { Operation } from "@expojet/core";
import type { CreateInput, StateAdapter } from "@expojet/schemas";
import { z } from "zod";
import type { Adapter } from "./contract.js";

const noOptions = z.object({}).strict();

function location(structure: "standalone" | "monorepo" | "monorepo-web") {
  const workspace = structure === "standalone" ? "." : "apps/mobile";
  return { workspace, root: workspace === "." ? "" : `${workspace}/` };
}

const zustandStoreSource = `import { create } from "zustand";

export interface AppState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));
`;

const zustandCounterCardSource = `import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { useAppStore } from "../store/use-app-store";

export function CounterCard() {
  const { count, increment, decrement, reset } = useAppStore();

  return (
    <View style={styles.card} testID="counter-card">
      <Text style={styles.eyebrow}>Zustand Store</Text>
      <Text style={styles.count} testID="counter-value">{count}</Text>
      <View style={styles.actions}>
        <Button title="-" onPress={decrement} testID="counter-decrement" />
        <Button title="Reset" onPress={reset} testID="counter-reset" />
        <Button title="+" onPress={increment} testID="counter-increment" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    gap: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "#315efb",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  count: {
    fontSize: 36,
    fontWeight: "800",
    color: "#121826",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
});
`;

const mobxStoreSource = `import { makeAutoObservable } from "mobx";

export class AppStore {
  count = 0;

  constructor() {
    makeAutoObservable(this);
  }

  increment = () => {
    this.count += 1;
  };

  decrement = () => {
    this.count -= 1;
  };

  reset = () => {
    this.count = 0;
  };
}

export const appStore = new AppStore();
`;

const mobxProviderSource = `import React, { createContext, useContext } from "react";
import { AppStore, appStore } from "./app-store";

const StoreContext = createContext<AppStore>(appStore);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return <StoreContext.Provider value={appStore}>{children}</StoreContext.Provider>;
}

export function useAppStore() {
  return useContext(StoreContext);
}
`;

const mobxCounterCardSource = `import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { observer } from "mobx-react-lite";
import { useAppStore } from "../store/provider";

export const CounterCard = observer(function CounterCard() {
  const store = useAppStore();

  return (
    <View style={styles.card} testID="counter-card">
      <Text style={styles.eyebrow}>MobX Store</Text>
      <Text style={styles.count} testID="counter-value">{store.count}</Text>
      <View style={styles.actions}>
        <Button title="-" onPress={store.decrement} testID="counter-decrement" />
        <Button title="Reset" onPress={store.reset} testID="counter-reset" />
        <Button title="+" onPress={store.increment} testID="counter-increment" />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    gap: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "#315efb",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  count: {
    fontSize: 36,
    fontWeight: "800",
    color: "#121826",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
});
`;

export const zustandStateAdapter: Adapter = {
  id: "state:zustand",
  version: "1.0.0",
  kind: "state",
  displayName: "Zustand",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input: CreateInput): Operation[] {
    const { workspace, root } = location(input.structure);
    return [
      {
        type: "add-dependency",
        workspace,
        name: "zustand",
        version: "^5.0.3",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/store/use-app-store.ts`,
        content: zustandStoreSource,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/components/counter-card.tsx`,
        content: zustandCounterCardSource,
        owner: this.id,
      },
    ];
  },
};

export const mobxStateAdapter: Adapter = {
  id: "state:mobx",
  version: "1.0.0",
  kind: "state",
  displayName: "MobX",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input: CreateInput): Operation[] {
    const { workspace, root } = location(input.structure);
    return [
      {
        type: "add-dependency",
        workspace,
        name: "mobx",
        version: "^6.13.6",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace,
        name: "mobx-react-lite",
        version: "^4.1.0",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/store/app-store.ts`,
        content: mobxStoreSource,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/store/provider.tsx`,
        content: mobxProviderSource,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${root}src/components/counter-card.tsx`,
        content: mobxCounterCardSource,
        owner: this.id,
      },
    ];
  },
};

export const noneStateAdapter: Adapter = {
  id: "state:none",
  version: "1.0.0",
  kind: "state",
  displayName: "None",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(_input: CreateInput): Operation[] {
    return [];
  },
};

export function stateAdapter(id: StateAdapter): Adapter {
  switch (id) {
    case "zustand":
      return zustandStateAdapter;
    case "mobx":
      return mobxStateAdapter;
    case "none":
      return noneStateAdapter;
  }
}
