import NextAuth, { type DefaultSession, type DefaultUser } from 'next-auth';
import type { DefaultJWT, JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';

import { HttpHeader, isDefined, MimeType, upperCase } from '@mars/common';
import axios, { AxiosResponse } from 'axios';
import { NextApiHandler } from 'next';

const route = NextAuth({
    pages: {
        signIn: '/auth/login',
    },
    debug: process.env.NODE_ENV !== 'production',
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
                const cookies = parseCookie(req.headers);
                console.log(cookies);

                const bearer = credential.token;
                const res: AxiosResponse<any> = await api
                    .get('/auth/whoami', {
                        withCredentials: true,
                        headers: {
                            [HttpHeader.COOKIE]: req.headers.cookie,
                        },
                    })
                    .catch(api.serverSideErrorLog);

                if (axios.isAxiosError(res)) {
                    return Promise.reject(
                        Error((res.response?.data as any)?.detail ?? res.message)
                    );
                }
                const data = res.data;

                console.log('Whoami', data);
                return {
                    id: data.id,
                    nik: data.nik,
                    name: data.name,
                    tg: data.telegramId,
                    email: data.email,
                    username: data.username,
                    witel: data.witel,
                    sto: data.sto,
                    roles: data.roles || [],
                    accessToken: bearer,
                    refreshToken: credential.refreshToken,
                };
            },
        }),
    ],
    jwt: {
        maxAge: 60 * 60 * 2,
    },
    session: {
        maxAge: 60 * 60 * 2,
        strategy: 'jwt',
    },

    callbacks: {
        async jwt({ token, user }) {
            console.log('Next-Auth: Generate JWT');
            if (user) {
                // console.log('User Login', user);
                token.tg = user.tg;
                token.nik = user.nik;
                token.name = user.name;
                token.email = user.email;
                token.sub = user.id;
                token.witel = user.witel;
                token.sto = user.sto;
                token.roles = user.roles;

                token.accessToken = user.accessToken;
                token.refreshToken = user.refreshToken;
            }

            const authorize = await api
                .get('/auth/whoami', {
                    headers: {
                        [HttpHeader.AUTHORIZATION]: `Bearer ${token.accessToken}`,
                    },
                })
                .catch(api.serverSideErrorLog);

            if (axios.isAxiosError(authorize)) {
                const status = authorize.response?.status;
                if (status === 400 || status === 401) {
                    const { code } = (authorize.response.data || {}) as any;
                    if (code === 'refresh-required')
                        await refreshToken(token, token.refreshToken);
                    else {
                        token.accessToken = null;
                        token.refreshToken = null;
                    }
                }
            }

            return token;
        },
        session({ session, token, user }) {
            console.log('Next-Auth: Generate Session');
            if (token) {
                // console.log('Mapping Session From Token', token);

                const roles: string[] = [];
                for (const role of token.roles) roles.push(role);

                session.roles = roles;
                session.user = {
                    id: token.sub,
                    name: token.name,
                    email: token.email,
                    nik: token.nik,
                    witel: token.witel,
                    sto: token.sto,
                };
            }

            session.bearer = token.accessToken;
            if (isDefined(session.bearer)) return session;
            return Promise.reject(Error('Unauthorized'));
        },
    },
});

async function refreshToken(token: JWT, refresher: string) {
    const res = await api
        .post('/auth/refresh', { refreshToken: refresher })
        .catch(api.serverSideErrorLog);

    if (!axios.isAxiosError(res)) {
        const { accessToken, refreshToken } = res.data;
        token.bearer = accessToken;
        token.refresher = refreshToken;
    } else {
        token.bearer = null;
        token.refresher = null;
    }
}

function parseCookie(headers: Record<string, any>) {
    const cookie: string = headers.cookie;
    if (cookie) {
        return Object.fromEntries(
            cookie.split('; ').map((e) => {
                const [key, value] = e.split('=');
                return [key, value] as const;
            })
        );
    }

    return {};
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

        accessToken: string;
        refreshToken: string;
    }
}

declare module 'next-auth/jwt' {
    export interface JWT extends map, DefaultJWT {
        accessToken: string;
        refreshToken: string;

        tg: number;
        name: string;
        nik: string;
        roles: string[];
        witel: Mars.Witel;
        sto: string;
    }
}

declare global {
    interface MarsUserSession {
        id: string;
        nik: string;
        name: string;
        email: string;
        sto: string;
        witel: Mars.Witel;
    }
}
