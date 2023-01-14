import { Layout, Spin } from 'antd';
import { useRouter } from 'next/router';
import { useCallback, useContext, useState } from 'react';
import { PageContext, PageProvider } from '_ctx/page.ctx';
import PageHeader from './page-header';
import PageSidebar from './page-sidebar';

const dash = ['/_error', '/auth'];
const isExcluded = (t: string) => dash.findIndex((e) => t.startsWith(e)) !== -1;

const { Content } = Layout;
function Page(props: HasChild) {
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

export default Page;

function LoadingLayout(props: HasChild) {
    const ctx = useContext(PageContext);
    return <>{props.children}</>;
}
