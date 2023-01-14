import NextAuth, { type DefaultSession, type DefaultUser } from 'next-auth';
import type { DefaultJWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';

import { HttpHeader, MimeType, upperCase } from '@mars/common';
import axios, { AxiosResponse } from 'axios';

const route = NextAuth({
    pages: {
        signIn: '/auth/login',
    },

    providers: [
        CredentialsProvider({
            id: 'mars-roc',
            name: 'mars-roc',
            type: 'credentials',
            credentials: {
                token: { type: 'input', label: 'Token' },
            },
            async authorize(credential, req) {
                const bearer = credential.token;
                const res: AxiosResponse<any> = await api
                    .get('/auth/whoami', {
                        headers: {
                            [HttpHeader.AUTHORIZATION]: 'Bearer ' + bearer,
                        },
                    })
                    .catch((err) => err);

                if (axios.isAxiosError(res)) {
                    return Promise.reject(
                        Error((res.response?.data as any)?.detail ?? res.message)
                    );
                }
                const data = res.data;
                return {
                    id: data.id,
                    nik: data.nik,
                    name: data.name,
                    tg: data.telegramId,
                    email: data.email,
                    username: data.username,
                    roles: data.roles || [],
                    group: {
                        id: data.group.id,
                        name: data.group.name,
                        roles: data.group.roles || [],
                    },
                    token: bearer,
                };
            },
        }),
    ],
    jwt: {
        maxAge: 60 * 60 * 24,
    },
    session: {
        maxAge: 60 * 60 * 24,
        strategy: 'jwt',
    },

    callbacks: {
        jwt({ token, user }) {
            if (user) {
                // console.log('User Login', user);
                token.tg = user.tg;
                token.name = user.name;
                token.email = user.email;
                token.sub = user.id;
                token.roles = user.roles;
                token.group = user.group;

                token.bearer = user.token;
            }
            return token;
        },
        session({ session, token, user }) {
            if (user) {
                // console.log('Mapping Session From user', user);

                const roles: MarsRole[] = [];
                for (const role of user.roles) roles.push({ name: role, isGroup: false });

                for (const role of user.group.roles)
                    roles.push({ name: role, isGroup: true });

                session.roles = roles;
                session.user = {
                    name: user.name,
                    nik: user.nik,
                    email: user.email,
                    group: user.group.id,
                };
            } else if (token) {
                // console.log('Mapping Session From Token', token);

                const roles: MarsRole[] = [];
                for (const role of token.roles)
                    roles.push({ name: role, isGroup: false });

                for (const role of token.group.roles)
                    roles.push({ name: role, isGroup: true });

                session.roles = roles;
                session.user = {
                    name: token.name,
                    email: token.email,
                    nik: token.nik,
                    group: token.group.id,
                };
            }

            session.bearer = token.bearer;
            return session;
        },
    },
});

export default route;

// interface TokenRes extends map {
//     access_token: string;
//     expired_at: number;
// }

// declare module 'next-auth/core/types' {
//     export interface Session extends map<any>, DefaultSession {
//         user: MarsUserSession;
//         bearer: string;
//         roles: MarsRole[];
//     }

//     export interface User extends map, DefaultUser {
//         [x: string]: any;
//         tg: number;
//         nik: string;
//         name: string;
//         email: string;
//         username: string;
//         roles: string[];
//         group: { id: string; name: string; roles: string[] };
//         token: string;
//     }
// }
// declare module 'next-auth/jwt/types' {
// export interface JWT extends map, DefaultJWT {
//     [x: string]: any;
// }
// }

declare module 'next-auth' {
    export interface Session extends map<any>, DefaultSession {
        user: MarsUserSession;
        bearer: string;
        roles: MarsRole[];
    }

    export interface User extends map, DefaultUser {
        [x: string]: any;
        tg: number;
        nik: string;
        name: string;
        email: string;
        username: string;
        roles: string[];
        group: { id: string; name: string; roles: string[] };
        token: string;
    }
}

declare module 'next-auth/jwt' {
    export interface JWT extends map, DefaultJWT {
        [x: string]: any;
    }
}

declare global {
    interface MarsUserSession {
        nik: string;
        name: string;
        email: string;
        group: string;
    }

    interface MarsRole {
        name: string;
        isGroup: boolean;
    }
}
