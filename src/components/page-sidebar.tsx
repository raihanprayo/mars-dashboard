import { BarChartOutlined, AuditOutlined, TeamOutlined } from "@ant-design/icons";
import { Layout, Menu } from "antd";
import { SiderContext } from "antd/lib/layout/Sider";
import Link from "next/link";
import { useContext } from "react";
import { PageContext } from "_ctx/page.ctx";
import { MarsIcon } from "./logo/mars-roc";

function PageSidebar() {
    const ctx = useContext(PageContext);

    return (
        <Layout.Sider
            trigger={null}
            theme="light"
            width={220}
            collapsible
            collapsed={ctx.collapsed}
            collapsedWidth={70}
        >
            <div className="logo">
                <Link href="/">
                    <MarsIcon />
                </Link>
            </div>
            <Menu
                mode="inline"
                items={[
                    {
                        key: "tickets",
                        title: "Tickets",
                        label: "Tickets",
                        icon: <AuditOutlined />,
                    },
                    {
                        key: "reports",
                        title: "Reports",
                        label: "Reports",
                        icon: <BarChartOutlined />,
                    },
                    {
                        key: "leaderboards",
                        title: "Leaderboards",
                        label: "Leaderboards",
                        icon: <TeamOutlined />,
                    },
                ]}
            />
        </Layout.Sider>
    );
}

export default PageSidebar;
