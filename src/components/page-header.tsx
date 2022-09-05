import { MenuUnfoldOutlined, MenuFoldOutlined } from "@ant-design/icons";
import { Menu, Layout } from "antd";
import { useContext, CSSProperties } from "react";
import { PageContext } from "_ctx/page.ctx";
import DateCounter from "./date-counter";

function PageHeader() {
    const ctx = useContext(PageContext);

    const FoldIcon = ctx.collapsed ? MenuUnfoldOutlined : MenuFoldOutlined;
    const FoldStyle: CSSProperties = {
        fontSize: 20,
        padding: "0",
    };

    const onFoldClick = () => ctx.setCollapse(!ctx.collapsed);

    return (
        <Layout.Header style={{ padding: 0, height: 56 }}>
            <Menu mode="horizontal" theme="light" style={{ height: 56 }} selectable={false}>
                <Menu.Item
                    key="fold-btn"
                    onClick={onFoldClick}
                    icon={<FoldIcon style={FoldStyle} />}
                />
                <Menu.Item key="date-counter">
                    <DateCounter />
                </Menu.Item>
            </Menu>
        </Layout.Header>
    );
}

export default PageHeader;
