import NextAuth, { type DefaultSession, type DefaultUser } from 'next-auth';
import type { DefaultJWT, JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';

import { HttpHeader, isDefined, MimeType, upperCase } from '@mars/common';
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
                refreshToken: { type: 'input', label: 'Refresh Token' },
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
                    refreshToken: credential.refreshToken,
                };
            },
        }),
    ],
    jwt: {
        maxAge: 60 * 60 * 18,
    },
    session: {
        maxAge: 60 * 60 * 18,
        strategy: 'jwt',
    },

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                // console.log('User Login', user);
                token.tg = user.tg;
                token.nik = user.nik;
                token.name = user.name;
                token.email = user.email;
                token.sub = user.id;
                token.roles = user.roles;
                token.group = user.group;

                token.bearer = user.token;
                token.refresher = user.refreshToken;
            }

            const authorize = await api
                .get('/auth/authorize', {
                    headers: {
                        [HttpHeader.AUTHORIZATION]: `Bearer ${token.bearer}`,
                    },
                })
                .catch((err) => err);

            if (axios.isAxiosError(authorize)) {
                const status = authorize.response?.status;
                if (status === 400 || status === 401) {
                    const { code } = (authorize.response.data || {}) as any;
                    if (code === 'refresh-required')
                        await refreshToken(token, token.refresher);
                    else {
                        token.bearer = null;
                        token.refresher = null;
                    }
                }
            }

            return token;
        },
        session({ session, token, user }) {
            if (token) {
                // console.log('Mapping Session From Token', token);

                const roles: string[] = [];
                for (const role of token.roles) roles.push(role);

                session.roles = roles;
                session.user = {
                    name: token.name,
                    email: token.email,
                    nik: token.nik,
                    group: token.group.id,
                };
            }

            session.bearer = token.bearer;
            if (isDefined(session.bearer)) return session;
            return Promise.reject(Error('Unauthorized'));
        },
    },
});

async function refreshToken(token: JWT, refresher: string) {
    const res = await api
        .post('/auth/refresh', { refreshToken: refresher })
        .catch((err) => err);

    if (!axios.isAxiosError(res)) {
        const { accessToken, refreshToken } = res.data;
        token.bearer = accessToken;
        token.refresher = refreshToken;
    } else {
        token.bearer = null;
        token.refresher = null;
    }
}

export default route;

declare module 'next-auth' {
    export interface Session extends map<any>, DefaultSession {
        user: MarsUserSession;
        bearer: string;
        roles: string[];
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
        refreshToken: string;
    }
}

declare module 'next-auth/jwt' {
    export interface JWT extends map, DefaultJWT {
        [x: string]: any;
        bearer: string;
        refresher: string;
    }
}

declare global {
    interface MarsUserSession {
        nik: string;
        name: string;
        email: string;
        group: string;
    }
}
