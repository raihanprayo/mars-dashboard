import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';

type NextAuthClientSession = ReturnType<typeof useSession>;

export function useRole(session?: NextAuthClientSession): RoleHook {
    if (!session) session = useSession({ required: false });

    const roles = session.data?.roles || [];
    const hook: RoleHook = useMemo(
        () => ({
            roles,
            hasRole(name, group = false) {
                return roles.findIndex((role) => role === name) !== -1;
            },
            isAdmin() {
                return hook.hasRole('admin');
            },
            isUser() {
                return hook.hasRole('user');
            },
        }),
        [session.data?.bearer]
    );

    return hook;
}

export interface RoleHook {
    readonly roles: string[];
    hasRole(name: string, group?: boolean): boolean;
    isAdmin(): boolean;
    isUser(): boolean;
}
