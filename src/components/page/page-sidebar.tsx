import { isDefined, upperCase } from '@mars/common';
import { Badge, Layout, Menu, Typography } from 'antd';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import PageRoutes, { filterRoute, PageRoute } from '_comp/routes';
import { useApp } from '_ctx/app.ctx';
import { PageContext } from '_ctx/page.ctx';
import { MarsIcon } from '../logo/mars-roc';

const { SubMenu } = Menu;
const capitalize = (s: string) => upperCase(s, true);
const lowercase = (s: string) => s.toLowerCase();
const getKey = (name: string, index: number) => {
    const string = `${name}-${index}`;
    let key = string.replace(' ', '-');
    return key.charAt(0).toLowerCase() + key.slice(1);
};

let rootSubMenuKeys: string[] = [];

function PageSidebar() {
    const { pathname } = useRouter();
    const appCtx = useApp();
    const { collapsed } = useContext<PageContext>(PageContext);

    const session = useSession();
    const [openKeys, setOpenKeys] = useState([]);
    const [appRoutes, setAppRoutes] = useState(PageRoutes);

    useEffect(() => {
        const filtered = PageRoutes.map((route) =>
            filterRoute(route, session.data)
        ).filter(isDefined);

        setAppRoutes(filtered);

        filtered.forEach((route, index) => {
            const isCurrentPath = pathname.indexOf(lowercase(route.name)) > -1;
            const key = getKey(route.name, index);
            rootSubMenuKeys.push(key);
            if (isCurrentPath) setOpenKeys([key]);
        });
    }, []);

    const onOpenChange = (openKeys: string[]) => {
        const latestOpenKey = openKeys.slice(-1) as unknown as string;
        if (latestOpenKey && rootSubMenuKeys.indexOf(latestOpenKey) === -1) {
            setOpenKeys([...latestOpenKey]);
        } else {
            setOpenKeys(latestOpenKey ? [...latestOpenKey] : []);
        }
    };

    const username = session.data?.user.name || 'User';

    return (
        <Layout.Sider width={220} theme="light" collapsed={collapsed}>
            <div className="logo">
                <Link href="/">
                    <MarsIcon />
                </Link>
                <br />
                <Typography.Title level={5}>{appCtx.witel}</Typography.Title>
                {!collapsed && <Typography.Text>{username}</Typography.Text>}
            </div>
            {
                <Menu
                    theme="light"
                    className="border-0 scroll-y sidebar"
                    style={{ flex: 1, height: '100%' }}
                    mode="inline"
                    openKeys={openKeys}
                    onOpenChange={onOpenChange}
                    multiple={false}
                >
                    {appRoutes.map((route, i) => renderMenu(pathname, route, i))}
                </Menu>
            }
        </Layout.Sider>
    );
}

export default PageSidebar;

function renderMenu(selectedPath: string, route: PageRoute, index?: number) {
    if (route.type === 'page') {
        return (
            <Menu.Item
                key={getKey(route.name, index)}
                icon={route.icon}
                className={selectedPath === route.path ? 'ant-menu-item-selected' : ''}
            >
                <Link href={`${route.path ? route.path : '#'}`}>
                    <span>
                        <span className="mr-auto">{capitalize(route.name)}</span>
                        {route.badge && badgeTemplate(route.badge)}
                    </span>
                </Link>
            </Menu.Item>
        );
    }

    return (
        <SubMenu
            key={getKey(route.name, index)}
            icon={route.icon}
            title={<span>{capitalize(route.name)}</span>}
        >
            {route.children.map((subroute, i) => renderMenu(selectedPath, subroute, i))}
        </SubMenu>
    );
}

function badgeTemplate(badge: { value: number }) {
    return <Badge count={badge.value} className="left" />;
}
