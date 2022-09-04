import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { HttpHeader, MimeType } from "@mars/common";

const route = NextAuth({
    pages: {
        signIn: "/auth/login",
    },

    providers: [
        CredentialsProvider({
            id: "local",
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
                    const { data } = await api.post<TokenRes>(
                        "/user/login",
                        credential,
                        {
                            headers: {
                                [HttpHeader.CONTENT_TYPE]:
                                    MimeType.APPLICATION_JSON,
                            },
                        }
                    );

                    const { data: user } = await api.get<DTO.Users>(
                        "/user/info",
                        {
                            headers: {
                                [HttpHeader.AUTHORIZATION]: data.token,
                            },
                        }
                    );

                    return {
                        id: user.id,
                        tg: user.tgId,
                        nik: user.nik,
                        name: user.name,
                        group: user.group,
                        image: user.image,
                    };
                } catch (error) {
                    return null;
                }
            },
        }),
    ],
});

export default route;

interface TokenRes {
    token: string;
}
