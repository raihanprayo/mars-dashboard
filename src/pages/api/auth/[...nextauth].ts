import NextAuth, { DefaultUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { HttpHeader, MimeType, upperCase } from "@mars/common";
import axios, { AxiosResponse } from "axios";

const route = NextAuth({
    pages: {
        signIn: "/auth/login",
    },

    providers: [
        CredentialsProvider({
            id: "mars-roc",
            name: "mars-roc",
            type: "credentials",
            credentials: {
                nik: {
                    type: "text",
                    label: "NIK",
                },
                password: {
                    label: "Password",
                    type: "password",
                },
            },
            async authorize(credential, req) {
                try {
                    const { data: token } = await api.post<TokenRes>(
                        "/user/login",
                        credential,
                        {
                            headers: {
                                [HttpHeader.CONTENT_TYPE]: MimeType.APPLICATION_JSON,
                            },
                        }
                    );

                    console.log(token);
                    const { data: user } = await api.get<DTO.Users>("/user/info", {
                        headers: {
                            [HttpHeader.AUTHORIZATION]: "Bearer " + token.access_token,
                        },
                    });

                    return {
                        id: user.id,
                        tg: user.tgId,
                        nik: user.nik,
                        name: user.name,
                        group: user.group,
                        image: user.image,
                        token: token.access_token,
                    };
                } catch (ex) {
                    if (axios.isAxiosError(ex)) {
                        console.error(ex.toJSON());
                        console.error(ex.stack);

                        if (ex.response) {
                            const { status, data }: AxiosResponse = ex.response;

                            if (status === 401 || status === 400) {
                                const { code, message } = data;
                                return Promise.reject(new Error(`${code}: ${message}`));
                            }

                            return Promise.reject(
                                new Error(`${data?.code || "AUTH-99"}: ${data?.message}`)
                            );
                        } else return Promise.reject(ex.message);
                    } else console.error(ex);
                }
                return null;
            },
        }),
    ],

    callbacks: {
        jwt({ token, user }) {
            if (token && user) {
                token.sub = user.id;
                token.tg = user.tg;
                token.group = user.group;
                token.bearer = user.token;
            }
            return token;
        },

        session({ session, token, user }) {
            if (user) {
                session.user.tg = user.tg;
                session.user.name = user.name;
                session.user.bearer = user.token;
            }

            if (token) {
                session.user.tg = token.tg;
                session.user.name = token.name;
                session.user.bearer = token.bearer;
            }

            return session;
        },
    },
});

export default route;

interface TokenRes extends map {
    access_token: string;
    expired_at: number;
}

declare module "next-auth/core/types" {
    export interface Session extends map<any>, DefaultSession {
        user: MarsUserSession;
    }

    export interface User extends Record<string, unknown>, DefaultUser {
        [x: string]: any;
    }
}
declare module "next-auth/jwt/types" {
    export interface JWT extends Record<string, unknown>, DefaultJWT {
        [x: string]: any;
    }
}

interface MarsUserSession {
    tg: number;
    name: string;
    group: string;
    bearer: string;
}
