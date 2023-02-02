import { Layout, Spin } from 'antd';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMemo, useState,  } from 'react';
import { PageProvider } from '_ctx/page.ctx';
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

    const [collapsed, setCollapse] = useState(false);
    const [loading, setLoading] = useState(false);

    return (
        <PageProvider value={{ collapsed, setCollapse, loading, setLoading }}>
            <Layout>
                <PageSidebar />
                <Layout>
                    <PageHeader />
                    <Content style={{ overflowY: 'auto' }}>
                        <Spin className="spin-wrapper" spinning={loading}>
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
