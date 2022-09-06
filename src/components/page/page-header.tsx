import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    LogoutOutlined,
    LoginOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { Menu, Layout, Avatar, Badge } from "antd";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useContext, CSSProperties } from "react";
import { PageContext } from "_ctx/page.ctx";
import DateCounter from "../date-counter";

function PageHeader() {
    const ctx = useContext(PageContext);
    const session = useSession();
    const router = useRouter();
    const isLogin = session.status === "authenticated";

    const FoldIcon = ctx.collapsed ? MenuUnfoldOutlined : MenuFoldOutlined;
    const IconStyle: CSSProperties = {
        fontSize: 20,
        padding: "0",
    };

    const onFoldClick = () => ctx.setCollapse(!ctx.collapsed);

    const LoginLogoutIcon =
        session.status === "authenticated" ? LogoutOutlined : LoginOutlined;

    const submenuTitle = (
        <Badge count={5}>
            <Avatar />
        </Badge>
    );

    return (
        <Layout.Header style={{ padding: 0, height: 56 }}>
            <Menu
                mode="horizontal"
                theme="light"
                style={{ height: 56 }}
                selectable={false}
                className="text-center"
            >
                <Menu.Item
                    key="fold-btn"
                    onClick={onFoldClick}
                    className="text-center"
                    icon={<FoldIcon style={IconStyle} />}
                />
                <Menu.Item key="date-counter" className="mr-auto text-center">
                    <DateCounter />
                </Menu.Item>

                <Menu.SubMenu
                    key="profile-menu"
                    title={submenuTitle}
                    popupOffset={[0, -5]}
                    className="text-center"
                    onTitleClick={(d) => router.push("/inbox")}
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
