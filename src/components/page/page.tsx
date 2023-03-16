import { isBool, isStr } from '@mars/common';
import { Layout, Spin } from 'antd';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useMemo, useState } from 'react';
import { CreatedBy } from '_comp/base/CreatedBy';
import { PageProvider } from '_ctx/page.ctx';
import { useBool } from '_hook/util.hook';
import { PageHeader } from './page-header';
import { PageSidebar } from './page-sidebar';

const dash = ['/_error', '/auth'];
const isExcluded = (t: string) => dash.findIndex((e) => t.startsWith(e)) !== -1;

const { Content } = Layout;
export function Page(props: HasChild) {
    const loc = useRouter();
    if (isExcluded(loc.pathname)) {
        return <>{props.children}</>;
    }

    // const [collapsed, setCollapse] = useState(false);
    // const [loading, setLoading] = useState(false);

    const collapsed = useBool();
    const [loading, setLoading] = useState<{ loading: boolean; desc?: string }>({
        loading: false,
        desc: undefined,
    });

    const setLoadingState = useCallback(
        (loading: bool | string, desc?: string) => {
            if (isBool(loading)) {
                setLoading({ loading, desc });
            } else if (isStr(loading)) {
                setLoading((prev) => ({ ...prev, desc: loading }));
            }
        },
        [loading.loading]
    );

    return (
        <PageProvider
            value={{
                collapsed: collapsed.value,
                setCollapse: collapsed.setValue,

                loading: loading.loading,
                setLoading: setLoadingState,
            }}
        >
            <Layout>
                <PageSidebar />
                <Layout>
                    <PageHeader />
                    <Content style={{ overflowY: 'auto' }}>
                        <Spin
                            className="spin-wrapper"
                            spinning={loading.loading}
                            tip={loading.desc}
                        >
                            {props.children}
                        </Spin>
                    </Content>
                </Layout>
            </Layout>
        </PageProvider>
    );
}

export function PageContent(props: PageWrapperProps) {
    const title = useMemo(() => {
        if (props.unPrefixed) return props.pageTitle;
        return `Mars - ${props.pageTitle}`;
    }, [props.pageTitle]);

    return (
        <>
            <Head>{props.pageTitle && <title>{title}</title>}</Head>
            {props.children}
        </>
    );
}
export interface PageWrapperProps extends HasChild {
    pageTitle?: string;
    unPrefixed?: boolean;
}
