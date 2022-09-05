import { Layout } from "antd";
import { useRouter } from "next/router";
import { useState } from "react";
import { PageProvider } from "_ctx/page.ctx";
import PageHeader from "./page-header";
import PageSidebar from "./page-sidebar";

const dash = ["/_error", "/auth"];
const isExcluded = (t: string) => dash.findIndex((e) => t.startsWith(e)) !== -1;

const { Content } = Layout;
function Page(props: HasChild) {
    const loc = useRouter();
    if (isExcluded(loc.pathname)) {
        return <>{props.children}</>;
    }

    const [collapsed, setCollapse] = useState(false);

    return (
        <PageProvider value={{ collapsed, setCollapse }}>
            <Layout>
                <PageSidebar />
                <Layout>
                        <PageHeader />
                    <Content>
                        {props.children}
                    </Content>
                </Layout>
            </Layout>
        </PageProvider>
    );
}

export default Page;
