import React, { useState } from "react";
import { DownOutlined } from "@ant-design/icons";
import { Dropdown, Menu, Space, Input, Button, Row, Col, Typography, Divider } from "antd";
import { useRouter } from "next/router";
import { NextPageContext } from "next";
import { ColRender } from "_comp/table/table.value";
import { mergeClassName } from "@mars/common";
import getConfig from "next/config";
import { OrderSider } from "_comp/orders/order-sider.info";

const { TextArea } = Input;
export default function DetailOrderPage(props: DetailOrderProps) {
    const route = useRouter();
    const config: NextAppConfiguration = getConfig();
    const [value, setValue] = useState("");

    const order = props.data;

    const request = (
        <Menu
            items={[
                {
                    label: (
                        <div>
                            Order ID : XXXXXXXXX <br />
                            Agent : Agent ybs <br />
                            Actual Solution : abcdefgh <br />
                            Worklog :abcdefgh
                        </div>
                    ),
                    key: "0",
                },
            ]}
        />
    );
    const menu = (
        <Menu
            mode="inline"
            items={[
                {
                    label: <a href="https://www.antgroup.com">Actual Solution 1</a>,
                    key: "0",
                },
                {
                    label: <a href="https://www.aliyun.com">Actual Solution 2</a>,
                    key: "1",
                },
                {
                    label: <a href="https://www.antgroup.com">Actual Solution 3</a>,
                    key: "2",
                },
                {
                    label: <a href="https://www.aliyun.com">Actual Solution 4</a>,
                    key: "3",
                },
                {
                    label: <a href="https://www.antgroup.com">Actual Solution 5</a>,
                    key: "4",
                },
                {
                    label: <a href="https://www.aliyun.com">Actual Solution 6</a>,
                    key: "5",
                },
            ]}
        />
    );

    const age = ColRender.calcOrderAge(order.opentime);
    const problem: DTO.Problem = order.problemtype as any;

    return (
        <div className="containerDetail">
            <div style={{ display: "flex" }}>
                <div className="detail-left">
                    <Row>
                        <Col span={12}>
                            <DetailItem label="Order No">{order.orderno}</DetailItem>
                            <DetailItem label="No Service">{order.serviceno}</DetailItem>
                            <DetailItem label="Tiket NOSSA">{order.incidentno}</DetailItem>
                            <DetailItem label="Status">
                                {ColRender.orderStatus(order.status, true)}
                            </DetailItem>
                        </Col>
                        <Col span={12}>
                            <DetailItem label="Umur Order">
                                {age.hour}j {age.minute}m
                            </DetailItem>
                            <DetailItem label="Umur Action">0m</DetailItem>
                            <DetailItem label="Kendala">{problem.name}</DetailItem>
                            <DetailItem label="Keterangan">
                                <Typography.Text>{order.notes || "-"}</Typography.Text>
                            </DetailItem>
                        </Col>
                    </Row>
                    <Divider />
                    <Row>
                        <Col span={12}>
                            <DetailItem label="Pengirim">{order.sendername}</DetailItem>
                            <DetailItem label="Service Type">
                                {ColRender.product(order.producttype)}
                            </DetailItem>
                            <DetailItem label="Request Type">{problem.name}</DetailItem>
                            <DetailItem label="Witel">{order.witel}</DetailItem>
                            <DetailItem label="STO">{order.sto}</DetailItem>
                        </Col>
                        <Col span={12}>
                            <DetailItem
                                label="Evidence"
                                spans={{
                                    value: order.attachment ? 24 : undefined,
                                }}
                            >
                                {!order.attachment ? (
                                    "-"
                                ) : (
                                    <img
                                        src={
                                            config.publicRuntimeConfig.service.url +
                                            "/file" +
                                            order.attachment
                                        }
                                        alt={order.attachment || "no image"}
                                        style={{ width: "80%" }}
                                    />
                                )}
                            </DetailItem>
                        </Col>
                    </Row>
                </div>
                <div
                    className={mergeClassName("detail-right", {
                        hide: !order.gaul,
                    })}
                >
                    <OrderSider order={order} />
                    {/* <div>
                        <span className="text-gaul">
                            Nomor ini telah terjadi GAUL sebanyak X Kali dengan Request Type
                            Internet lambat{" "}
                        </span>{" "}
                        <br />
                        <Dropdown
                            overlay={request}
                            trigger={["click"]}
                            placement="bottom"
                            className="dropdown-gaul"
                        >
                            <a onClick={(e) => e.preventDefault()}>
                                <Space>
                                    hh mm yyyy
                                    <DownOutlined />
                                </Space>
                            </a>
                        </Dropdown>{" "}
                        <br />
                        <Dropdown
                            overlay={request}
                            trigger={["click"]}
                            placement="bottom"
                            className="dropdown-gaul"
                        >
                            <a onClick={(e) => e.preventDefault()}>
                                <Space>
                                    hh mm yyyy
                                    <DownOutlined />
                                </Space>
                            </a>
                        </Dropdown>{" "}
                        <br />
                        <Dropdown
                            overlay={request}
                            trigger={["click"]}
                            placement="bottom"
                            className="dropdown-gaul"
                        >
                            <a onClick={(e) => e.preventDefault()}>
                                <Space>
                                    hh mm yyyy
                                    <DownOutlined />
                                </Space>
                            </a>
                        </Dropdown>
                    </div> */}
                </div>
            </div>
            <Divider />
            <div className="detail-work">
                <div className="dropdown-solution">
                    <Menu
                        mode="inline"
                        items={[
                            {
                                label: <span>Actual Solution</span>,
                                type: "group",
                                children: [
                                    {
                                        label: (
                                            <a href="https://www.antgroup.com">
                                                Actual Solution 1
                                            </a>
                                        ),
                                        key: "0",
                                    },
                                    {
                                        label: (
                                            <a href="https://www.aliyun.com">
                                                Actual Solution 2
                                            </a>
                                        ),
                                        key: "1",
                                    },
                                    {
                                        label: (
                                            <a href="https://www.antgroup.com">
                                                Actual Solution 3
                                            </a>
                                        ),
                                        key: "2",
                                    },
                                    {
                                        label: (
                                            <a href="https://www.aliyun.com">
                                                Actual Solution 4
                                            </a>
                                        ),
                                        key: "3",
                                    },
                                ],
                            },
                        ]}
                    />
                </div>
                <div className="worklog">
                    <TextArea
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="Ini Field untuk agent mengisi history (worklog) pengerjaan"
                        autoSize={{ minRows: 10, maxRows: 10 }}
                    />
                </div>
                <div className="button-detail">
                    <div className="inside-button">
                        <Button type="primary" block className="close-ticket">
                            Close Ticket
                        </Button>
                        <Button type="primary" block className="dispatch">
                            Dispatch
                        </Button>
                        <Button type="primary" block className="pending">
                            Pending
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

DetailOrderPage.getInitialProps = async (ctx: NextPageContext) => {
    const orderno = ctx.query.orderno;
    try {
        const res = await getOrder(orderno as string);
        console.log("* Order Detail", res.data);
        return { data: res.data };
    } catch (error) {}
    return {};
};

function getOrder(id: string, params: map = {}, inbox = false) {
    const url = `/order/by-noorder/${id}`;
    return api.get<DTO.Orders>(url, {
        params,
    });
}
function updateOrder(id: string, status: Mars.Status, desc?: string) {}

function DetailItem(props: DetailItemProps) {
    const { title = 6, separator = 1, value = 17 } = props.spans || {};
    return (
        <Row>
            <Col span={title}>
                <Typography.Title keyboard level={5}>
                    {props.label}
                </Typography.Title>
            </Col>
            <Col span={separator}>:</Col>
            <Col span={value}>{props.children}</Col>
        </Row>
    );
}

interface DetailOrderProps {
    data: DTO.Orders;
}
interface DetailItemProps {
    label: string;
    spans?: {
        title?: number;
        separator?: number;
        value?: number;
    };
    children: React.ReactNode;
}
