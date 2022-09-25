import {
    MenuUnfoldOutlined,
    MailOutlined,
    MenuFoldOutlined,
    BellOutlined,
    LogoutOutlined,
    LoginOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { Menu, Layout, Avatar, Badge, message, Button } from "antd";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, CSSProperties, useState, useEffect, useCallback } from "react";
import { PageContext } from "_ctx/page.ctx";
import DateCounter from "../date-counter";

function PageHeader() {
    const ctx = useContext(PageContext);
    const session = useSession();
    const router = useRouter();
    const [badge, setBadge] = useState(0);
    const isLogin = session.status === "authenticated";

    const FoldIcon = ctx.collapsed ? MenuUnfoldOutlined : MenuFoldOutlined;
    const IconStyle: CSSProperties = {
        fontSize: 22,
        padding: "0",
    };

    const onFoldClick = () => ctx.setCollapse(!ctx.collapsed);
    const getBadgeCounter = useCallback(() => {
        api.get("/order/inbox", {
            params: { counter: true },
        })
            .then((res) => setBadge(res.data))
            .catch((err) => console.error("Fetch Badge Counter: " + err.message));
    }, []);

    const LoginLogoutIcon =
        session.status === "authenticated" ? LogoutOutlined : LoginOutlined;

    useEffect(() => isLogin && getBadgeCounter(), [isLogin]);
    useEffect(() => {
        window.addEventListener("refresh-badge", getBadgeCounter);
        return () => {
            window.removeEventListener("refresh-badge", getBadgeCounter);
        };
    });

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

                <Menu.Item key="inbox-btn" title='Inbox'>
                    <Badge count={badge}>
                        <Link href="/inbox">
                            <BellOutlined style={IconStyle} />
                        </Link>
                    </Badge>
                </Menu.Item>

                <Menu.SubMenu
                    key="profile-menu"
                    title={<Avatar />}
                    popupOffset={[0, -5]}
                    className="text-center"
                    // onTitleClick={(d) => router.push("/inbox")}
                >
                    <Menu.Item icon={<UserOutlined />}>Profile</Menu.Item>
                    <Menu.Item
                        icon={<LoginLogoutIcon />}
                        onClick={() => {
                            signOut({ callbackUrl: "/auth/login", redirect: true });
                        }}
                    >
                        {isLogin ? "Logout" : "Login"}
                    </Menu.Item>
                </Menu.SubMenu>
            </Menu>
        </Layout.Header>
    );
}

export default PageHeader;
