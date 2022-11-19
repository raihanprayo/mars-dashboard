import '_service/api';
import '_styles/index.less';

import { HttpHeader, isFn } from '@mars/common';
import { setDefaultOptions } from 'date-fns';
import { id as IdnLocale } from 'date-fns/locale';
import type { AppContext, AppProps } from 'next/app';
import Head from 'next/head';
import { getSession, SessionProvider, signIn, useSession } from 'next-auth/react';
import { Session } from 'next-auth';
import { Page } from '_comp/page';
import { useEffect } from 'react';
import { ContextMenu } from '_comp/context-menu';

const dash = ['/auth/login', '/auth/register', '/_error', '/dashboard'];
const isExcluded = (t: string) => dash.findIndex((e) => t.startsWith(e)) !== -1;

setDefaultOptions({
    locale: IdnLocale,
});

function MarsRocApp({ Component, pageProps, router }: AppProps) {
    const session = useSession();
    const isUnauthenticated = session.status !== 'authenticated';

    console.log(session);

    useEffect(() => {
        if (!isUnauthenticated) localStorage.setItem('token', session.data.bearer);

        if (isUnauthenticated && !isExcluded(router.pathname)) {
            signIn();
        }
    }, [isUnauthenticated]);

    return (
        <>
            <Head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>

            <ContextMenu>
                <Page>
                    <Component {...pageProps} />
                </Page>
            </ContextMenu>
        </>
    );
}

function MarsRocWrapper(props: AppProps & CustomAppProps) {
    const { session, ...others } = props;

    return (
        <SessionProvider session={session} refetchInterval={60 * 5}>
            <MarsRocApp {...others} />
        </SessionProvider>
    );
}

namespace MarsRocWrapper {
    export async function getInitialProps({ Component, ctx }: AppContext) {
        let pageProps = {};
        const session = await getSession(ctx);

        if (isFn(Component.getInitialProps)) {
            (ctx as MarsPageContext).token = session?.bearer;
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
