import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    BellOutlined,
    LogoutOutlined,
    LoginOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Menu, Layout, Avatar, Badge } from 'antd';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useContext, CSSProperties, useState, useEffect, useCallback } from 'react';
import { PageContext } from '_ctx/page.ctx';
import { useUser } from '_hook/credential.hook';
import DateCounter from '../date-counter';

export function PageHeader() {
    const ctx = useContext(PageContext);
    const session = useSession();
    const user = useUser();
    const router = useRouter();
    const [badge, setBadge] = useState(0);
    const isLoggedin = session.status === 'authenticated';

    const FoldIcon = ctx.collapsed ? MenuUnfoldOutlined : MenuFoldOutlined;
    const IconStyle: CSSProperties = {
        fontSize: 22,
        padding: '0',
    };

    const onFoldClick = () => ctx.setCollapse(!ctx.collapsed);
    const getBadgeCounter = useCallback(() => {
        api.get('/ticket/inbox', {
            params: { counter: true },
        })
            .then((res) => {
                console.log('Badge Response', res.data);
                setBadge(Number(res.data?.total ?? res.data ?? 0));
            })
            .catch((err) => console.error('Fetch Badge Counter: ' + err.message));
    }, []);

    const LoginLogoutIcon =
        session.status === 'authenticated' ? LogoutOutlined : LoginOutlined;

    useEffect(() => isLoggedin && getBadgeCounter(), [isLoggedin]);
    useEffect(() => {
        if (!user.isAdmin()) {
            window.addEventListener('refresh-badge', getBadgeCounter);
            return () => {
                window.removeEventListener('refresh-badge', getBadgeCounter);
            };
        }
    }, [badge]);

    return (
        <Layout.Header style={{ padding: 0, height: 56 }}>
            <Menu
                mode="horizontal"
                theme="light"
                style={{ height: 56 }}
                selectable={false}
                className="text-center"
            >
                <Menu.Item key="fold-btn" onClick={onFoldClick} className="text-center">
                    <FoldIcon style={IconStyle} />
                </Menu.Item>
                <Menu.Item key="date-counter" className="mr-auto text-center">
                    <DateCounter />
                </Menu.Item>

                {!user.isAdmin() && (
                    <Menu.Item key="inbox-btn" title="Inbox">
                        <Badge count={badge}>
                            <Link href="/inbox">
                                <BellOutlined style={IconStyle} />
                            </Link>
                        </Badge>
                    </Menu.Item>
                )}

                <Menu.SubMenu
                    key="profile-menu"
                    title={<Avatar />}
                    popupOffset={[0, -5]}
                    className="text-center"
                    // onTitleClick={(d) => router.push("/inbox")}
                >
                    <Menu.Item
                        icon={<UserOutlined />}
                        onClick={() => router.push('/profile')}
                    >
                        Profile
                    </Menu.Item>
                    <Menu.Item
                        icon={<LoginLogoutIcon />}
                        onClick={() => {
                            signOut({ callbackUrl: '/auth/login', redirect: true });
                            localStorage.removeItem('token');
                            localStorage.removeItem('MARS-JWT');
                        }}
                    >
                        {isLoggedin ? 'Logout' : 'Login'}
                    </Menu.Item>
                </Menu.SubMenu>
            </Menu>
        </Layout.Header>
    );
}
