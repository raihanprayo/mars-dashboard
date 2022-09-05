import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Layout, Menu } from "antd";
import { useRouter } from "next/router";
import { CSSProperties, useContext, useEffect, useMemo, useRef, useState } from "react";
import { PageContext, PageProvider } from "_ctx/page.ctx";
import { DayEn, DayId, MonthEn, MonthId } from "_utils/enums";
import DateCounter from "./date-counter";

const dash = ["/_error", "/auth"];
const isExcluded = (t: string) => dash.findIndex((e) => t.startsWith(e)) !== -1;

const { Content, Header, Sider } = Layout;
function Page(props: HasChild) {
    const loc = useRouter();
    if (isExcluded(loc.pathname)) {
        return <>{props.children}</>;
    }

    const [collapsed, setCollapse] = useState(false);

    return (
        <PageProvider value={{ collapsed, setCollapse }}>
            <Layout>
                <PageSidebar collapsed={collapsed} />
                <Layout>
                    <Content>
                        <PageHeader />
                        {props.children}
                    </Content>
                </Layout>
            </Layout>
        </PageProvider>
    );
}

export default Page;

function PageHeader() {
    const ctx = useContext(PageContext);

    const FoldIcon = ctx.collapsed ? MenuUnfoldOutlined : MenuFoldOutlined;
    const FoldStyle: CSSProperties = {
        fontSize: 20,
        padding: "0",
    };

    useEffect(() => {
        // intervalRef.current = setInterval(() => )
    }, []);

    const onFoldClick = () => ctx.setCollapse(!ctx.collapsed);

    return (
        <Header style={{ padding: 0, height: 56 }}>
            <Menu mode="horizontal" theme="dark" style={{ height: 56 }} selectable={false}>
                <Menu.Item onClick={onFoldClick} icon={<FoldIcon style={FoldStyle} />} />
                <Menu.Item>
                    <DateCounter />
                </Menu.Item>
            </Menu>
        </Header>
    );
}

function PageSidebar(props: SidebarProps) {
    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={props.collapsed}
            collapsedWidth={70}
            width={220}
        >
            <Menu mode="inline"></Menu>
        </Sider>
    );
}

interface SidebarProps {
    collapsed: boolean;
}
