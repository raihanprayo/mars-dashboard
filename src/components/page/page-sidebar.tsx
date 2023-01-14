import { upperCase } from '@mars/common';
import { Badge, Layout, Menu } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import PageRoutes from '_comp/routes';
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
    const { collapsed } = useContext<PageContext>(PageContext);

    const [openKeys, setOpenKeys] = useState([]);
    const [appRoutes] = useState(PageRoutes);

    const badgeTemplate = (badge: { value: number }) => (
        <Badge count={badge.value} className="left" />
    );

    useEffect(() => {
        appRoutes.forEach((route, index) => {
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

    const menu = (
        <Menu
            theme="light"
            className="border-0 scroll-y sidebar"
            style={{ flex: 1, height: '100%' }}
            mode="inline"
            openKeys={openKeys}
            onOpenChange={onOpenChange}
            multiple={false}
        >
            {appRoutes.map((route, index) => {
                const hasChildren = route.children ? true : false;
                if (!hasChildren)
                    return (
                        <Menu.Item
                            key={getKey(route.name, index)}
                            className={
                                pathname === route.path ? 'ant-menu-item-selected' : ''
                            }
                            onClick={() => {
                                setOpenKeys([getKey(route.name, index)]);
                            }}
                            icon={route.icon}
                        >
                            {route.path && (
                                <Link href={route.path}>
                                    <i>
                                        <span className="mr-auto">
                                            {capitalize(route.name)}
                                        </span>
                                        {route.badge && badgeTemplate(route.badge)}
                                    </i>
                                </Link>
                            )}

                            {!route.path && (
                                <>
                                    <span className="mr-auto">
                                        {capitalize(route.name)}
                                    </span>
                                    {route.badge && badgeTemplate(route.badge)}
                                </>
                            )}
                        </Menu.Item>
                    );

                if (hasChildren)
                    return (
                        <SubMenu
                            key={getKey(route.name, index)}
                            icon={route.icon}
                            title={
                                <>
                                    <span>{capitalize(route.name)}</span>
                                    {route.badge && badgeTemplate(route.badge)}
                                </>
                            }
                        >
                            {route.children.map((subitem, index) => (
                                <Menu.Item
                                    key={getKey(subitem.name, index)}
                                    className={
                                        pathname === subitem.path
                                            ? 'ant-menu-item-selected'
                                            : ''
                                    }
                                >
                                    <Link href={`${subitem.path ? subitem.path : ''}`}>
                                        <i>
                                            <span className="mr-auto">
                                                {capitalize(subitem.name)}
                                            </span>
                                            {subitem.badge &&
                                                badgeTemplate(subitem.badge)}
                                        </i>
                                    </Link>
                                </Menu.Item>
                            ))}
                        </SubMenu>
                    );
            })}
        </Menu>
    );

    return (
        <Layout.Sider width={220} theme="light" collapsed={collapsed}>
            <div className="logo">
                <Link href="/">
                    <MarsIcon />
                </Link>
            </div>
            {menu}
        </Layout.Sider>
    );
}

export default PageSidebar;
