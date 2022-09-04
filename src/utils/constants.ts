import { isDefined, isObj } from "@mars/common";

export const isBrowser = isObj(globalThis.window);
export const isServer = !isBrowser;
