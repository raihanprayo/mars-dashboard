import { NextPage } from "next";
import { Session } from "next-auth";
import { getProviders, getSession } from "next-auth/react";
import Page from "_comp/page";


function LoginPage(props: { session: Session; providers: NextAuthProviders }) {
    return <></>
}

LoginPage.getInitialProps = async function (ctx) {
    const providers = await getProviders();
    const session = await getSession(ctx);

    return { session, providers };
};

export default LoginPage;

type NextAuthProviders = ReturnType<typeof getProviders> extends Promise<infer P> ? P : never;
