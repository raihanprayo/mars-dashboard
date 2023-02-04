import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { ROLE_ADMIN, ROLE_AGENT, ROLE_USER } from '_utils/constants';

type NextAuthClientSession = ReturnType<typeof useSession>;

export function useRole(session?: NextAuthClientSession): RoleHook {
    if (!session) session = useSession({ required: false });

    const roles = session.data?.roles || [];
    const hook: RoleHook = useMemo(
        () => ({
            roles,
            hasRole(name) {
                return roles.findIndex((role) => role === name) !== -1;
            },
            isAdmin() {
                return hook.hasRole(ROLE_ADMIN);
            },
            isUser() {
                return hook.hasRole(ROLE_AGENT) && hook.hasRole(ROLE_USER);
            },
        }),
        [session.status]
    );

    return hook;
}

export interface RoleHook {
    readonly roles: string[];
    hasRole(name: string): boolean;
    isAdmin(): boolean;
    isUser(): boolean;
}


export function useUser(): UserHook {
    const session = useSession();

    const hook: UserHook = useMemo(
        () => ({
            get user() {
                return session.data?.user;
            },
            get roles() {
                return session.data?.roles || [];
            },

            isLoggedIn() {
                return session.status === 'authenticated';
            },
            hasAnyRole(...predicates: string[]) {
                if (!hook.isLoggedIn()) return false;
                return (
                    predicates
                        .map((p) => session.data.roles.includes(p.toLowerCase()))
                        .findIndex((b) => b === true) !== -1
                );
            },
            isAdmin() {
                return hook.hasAnyRole(ROLE_ADMIN);
            },
            isUser() {
                return hook.hasAnyRole(ROLE_USER, ROLE_AGENT);
            },
        }),
        [session.status]
    );

    return hook;
}

export interface UserHook {
    readonly user?: Session['user'];
    readonly roles: string[];

    hasAnyRole(...predicates: string[]): boolean;

    isLoggedIn(): boolean;
    isAdmin(): boolean;
    isUser(): boolean;
}