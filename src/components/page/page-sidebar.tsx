import {
    BarChartOutlined,
    AuditOutlined,
    TeamOutlined,
    ScheduleOutlined,
} from '@ant-design/icons';
import { Layout, Menu } from 'antd';
import Link from 'next/link';
import { useContext, useState } from 'react';
import { PageContext } from '_ctx/page.ctx';
import { MarsIcon } from '../logo/mars-roc';

function PageSidebar() {
    const ctx = useContext(PageContext);

    const [collapsed, setCollapse] = useState(false);

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
                        key: 'tickets',
                        title: 'Tickets',
                        label: <Link href="/">Tickets</Link>,
                        icon: <AuditOutlined />,
                        onClick(info) {},
                    },
                    {
                        key: 'inbox',
                        title: 'Inbox',
                        label: <Link href='/inbox'>Inbox</Link>,
                        icon: <ScheduleOutlined />,
                    },
                    {
                        key: 'reports',
                        title: 'Reports',
                        label: 'Reports',
                        icon: <BarChartOutlined />,
                    },
                    {
                        key: 'leaderboards',
                        title: 'Leaderboards',
                        label: 'Leaderboards',
                        icon: <TeamOutlined />,
                    },
                ]}
            />
        </Layout.Sider>
    );
}

export default PageSidebar;
