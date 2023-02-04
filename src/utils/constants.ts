import { isDefined, isObj } from "@mars/common";

export const isBrowser = isObj(globalThis.window);
export const isServer = !isBrowser;

export const ROLE_ADMIN = 'admin';
export const ROLE_AGENT = 'user_agent';
export const ROLE_USER = 'user';