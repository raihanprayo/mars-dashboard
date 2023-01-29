import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';

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
                return hook.hasRole('admin');
            },
            isUser() {
                return hook.hasRole('user_dashboard') && hook.hasRole('user');
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
                return hook.hasAnyRole('admin');
            },
            isUser() {
                return hook.hasAnyRole('user', 'user_dashboard');
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