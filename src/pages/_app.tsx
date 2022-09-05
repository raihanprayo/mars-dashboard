import "_service/api";
import "_styles/index.less";

import { isFn } from "@mars/common";
import { Layout, message } from "antd";
import type { AppContext, AppProps } from "next/app";
import Head from "next/head";
import { getSession, SessionProvider, signIn, useSession } from "next-auth/react";
import { Session } from "next-auth";
import { isBrowser } from "_utils/constants";
import Page from "_comp/page";

const dash = ["/auth/login", "/auth/register", "/_error", "/dashboard"];
const isExcluded = (t: string) => dash.findIndex((e) => t.startsWith(e)) !== -1;

function MarsRocApp({ Component, pageProps, router }: AppProps) {
    const session = useSession();
    const isUnauthenticated = session.status !== "authenticated";

    console.log(session);
    if (isUnauthenticated && isExcluded(router.pathname)) {
        if (isBrowser) signIn();
        return <></>;
    }

    return (
        <>
            <Head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>

            <Page>
                <Component {...pageProps} />
            </Page>
        </>
    );
}

function MarsRocWrapper(props: AppProps & CustomAppProps) {
    const { session, ...others } = props;

    return (
        <SessionProvider session={session}>
            <MarsRocApp {...others} />
        </SessionProvider>
    );
}

namespace MarsRocWrapper {
    export async function getInitialProps({ Component, ctx }: AppContext) {
        let pageProps = {};
        const session = await getSession(ctx);

        if (isFn(Component.getInitialProps)) {
            Object.assign(pageProps, await Component.getInitialProps(ctx));
        }

        return {
            session,
            pageProps,
        };
    }
}

export default MarsRocWrapper;

interface CustomAppProps {
    session: Session;
}
