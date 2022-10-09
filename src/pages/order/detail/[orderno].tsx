import React, { createContext, useCallback, useContext, useState } from 'react';
import { Menu, Input, Button, Row, Col, Typography, Divider } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import { NextPageContext } from 'next';
import { Render } from '_comp/value-renderer';
import { HttpHeader, mergeClassName, MimeType } from '@mars/common';
import getConfig from 'next/config';
import { OrderSider } from '_comp/orders/order-sider.info';
import axios from 'axios';

const { TextArea } = Input;
const DetailSpanCtx = createContext<DetailItemProps['spans']>({});
export default function DetailOrderPage(props: DetailOrderProps) {
    const route = useRouter();
    const config: NextAppConfiguration = getConfig();
    const [worklog, setWorklog] = useState('');

    const order = props.data;
    if (props.error) {
        const { status, message, code } = props.error;
        return (
            <div className="err-container">
                <div className="wrap">
                    <Typography.Title type="danger" level={4}>
                        {status} | {code}
                    </Typography.Title>
                </div>
                <div className="wrap">
                    <Typography.Title level={5}>{message}</Typography.Title>
                    <Button
                        type="dashed"
                        icon={<ReloadOutlined />}
                        onClick={() => window.location.reload()}
                    >
                        refresh the page
                    </Button>
                </div>
            </div>
        );
    }

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
                    key: '0',
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
                    key: '0',
                },
                {
                    label: <a href="https://www.aliyun.com">Actual Solution 2</a>,
                    key: '1',
                },
                {
                    label: <a href="https://www.antgroup.com">Actual Solution 3</a>,
                    key: '2',
                },
                {
                    label: <a href="https://www.aliyun.com">Actual Solution 4</a>,
                    key: '3',
                },
                {
                    label: <a href="https://www.antgroup.com">Actual Solution 5</a>,
                    key: '4',
                },
                {
                    label: <a href="https://www.aliyun.com">Actual Solution 6</a>,
                    key: '5',
                },
            ]}
        />
    );

    const age = Render.calcOrderAge(order.opentime);
    const problem: DTO.Problem = order.problemtype as any;

    const onDetailBtnClick = useCallback(
        (s: Mars.Status.CLOSED | Mars.Status.DISPATCH | Mars.Status.PENDING) => () => {
            updateStatus[s](order.id, worklog)
                .then((res) => window.dispatchEvent(new Event('refresh-badge')))
                .catch((err) => {});
        },
        [worklog]
    );

    const detailSpans: Exclude<DetailItemProps['spans'], undefined> = {
        title: order.gaul ? 8 : 6,
        separator: 1,
        value: order.gaul ? 15 : 17,
    };

    return (
        <>
            <div style={{ display: 'flex' }}>
                <div className="detail-left">
                    <DetailSpanCtx.Provider value={detailSpans}>
                        <Row>
                            <Col span={12}>
                                <DetailItem label="Order No">{order.orderno}</DetailItem>
                                <DetailItem label="No Service">
                                    {order.serviceno}
                                </DetailItem>
                                <DetailItem label="Tiket NOSSA">
                                    {order.incidentno}
                                </DetailItem>
                                <DetailItem label="Status">
                                    {Render.orderStatus(order.status, true)}
                                </DetailItem>
                            </Col>
                            <Col span={12}>
                                <DetailItem label="Umur Order">
                                    {age.hour}j {age.minute}m
                                </DetailItem>
                                <DetailItem label="Umur Action">0m</DetailItem>
                                <DetailItem label="Kendala">{problem.name}</DetailItem>
                                <DetailItem label="Keterangan">
                                    <Typography.Text>
                                        {order.notes || '-'}
                                    </Typography.Text>
                                </DetailItem>
                            </Col>
                        </Row>
                        <Divider />
                        <Row>
                            <Col span={12}>
                                <DetailItem label="Pengirim">
                                    {order.sendername}
                                </DetailItem>
                                <DetailItem label="Service Type">
                                    {Render.product(order.producttype)}
                                </DetailItem>
                                <DetailItem label="Request Type">
                                    {problem.name}
                                </DetailItem>
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
                                        '-'
                                    ) : (
                                        <img
                                            src={
                                                config.publicRuntimeConfig.service.url +
                                                '/file' +
                                                order.attachment
                                            }
                                            alt={order.attachment || 'no image'}
                                            style={{ width: '80%' }}
                                        />
                                    )}
                                </DetailItem>
                            </Col>
                        </Row>
                    </DetailSpanCtx.Provider>
                </div>
                <div
                    className={mergeClassName('detail-right', {
                        hide: !order.gaul,
                    })}
                >
                    <OrderSider order={order} />
                </div>
            </div>
            <Divider />
            <div className="detail-work">
                <div className="detail-solution">
                    <Menu
                        mode="inline"
                        items={[
                            {
                                label: <span>Actual Solution</span>,
                                type: 'group',
                                children: [
                                    {
                                        label: (
                                            <a href="https://www.antgroup.com">
                                                Actual Solution 1
                                            </a>
                                        ),
                                        key: '0',
                                    },
                                    {
                                        label: (
                                            <a href="https://www.aliyun.com">
                                                Actual Solution 2
                                            </a>
                                        ),
                                        key: '1',
                                    },
                                    {
                                        label: (
                                            <a href="https://www.antgroup.com">
                                                Actual Solution 3
                                            </a>
                                        ),
                                        key: '2',
                                    },
                                    {
                                        label: (
                                            <a href="https://www.aliyun.com">
                                                Actual Solution 4
                                            </a>
                                        ),
                                        key: '3',
                                    },
                                ],
                            },
                        ]}
                    />
                </div>
                <div className="detail-worklog">
                    <TextArea
                        value={worklog}
                        onChange={(e) => setWorklog(e.target.value)}
                        placeholder="Ini Field untuk agent mengisi history (worklog) pengerjaan"
                    />
                </div>
                <div className="detail-button">
                    <div className="detail-button-container">
                        <Button
                            type="primary"
                            block
                            onClick={onDetailBtnClick(Mars.Status.CLOSED)}
                            className="d-btn close"
                        >
                            <b>Close Ticket</b>
                        </Button>
                        <Button
                            type="primary"
                            block
                            onClick={onDetailBtnClick(Mars.Status.DISPATCH)}
                            className="d-btn dispatch"
                        >
                            <b>Dispatch</b>
                        </Button>
                        <Button
                            type="primary"
                            block
                            onClick={onDetailBtnClick(Mars.Status.PENDING)}
                            className="d-btn pending"
                        >
                            <b>Pending</b>
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

DetailOrderPage.getInitialProps = async (ctx: NextPageContext) => {
    const orderno = ctx.query.orderno;
    try {
        const res = await getOrder(orderno as string);
        console.log('* Order Detail', res.data);
        return { data: res.data };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            switch (error.code) {
                case NodeJS.SystemErr.ECONNREFUSED: {
                    return {
                        error: {
                            code: error.code,
                            status: 500,
                            message: 'Unable to connect to core-service',
                        },
                    };
                }

                default:
                    break;
            }
        }
    }

    return { error: 'Internal Server Error' };
};

function getOrder(no: string, params: map = {}) {
    const url = `/order/by-noorder/${no}`;
    return api.get<DTO.Orders>(url, { params });
}

function DetailItem(props: DetailItemProps) {
    const ctx = useContext(DetailSpanCtx);
    const {
        title = ctx.title,
        separator = ctx.separator,
        value = ctx.value,
    } = props.spans || {};
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
    error?: any;
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

const updateStatusUrl = '/order/update/status/dashboard';
const updateStatus = {
    update(id: string, status: Mars.Status, description: string) {
        return api
            .put<DTO.OrderAssignment>(`${updateStatusUrl}/${id}/${status}`, description, {
                headers: {
                    [HttpHeader.CONTENT_TYPE]: MimeType.TEXT_PLAIN,
                },
            })
            .then((res) => res.data);
    },
    [Mars.Status.CLOSED](id: string, description: string) {
        return updateStatus.update(id, Mars.Status.CLOSED, description);
    },
    [Mars.Status.DISPATCH](id: string, description: string) {
        return updateStatus.update(id, Mars.Status.DISPATCH, description);
    },
    [Mars.Status.PENDING](id: string, description: string) {
        return updateStatus.update(id, Mars.Status.PENDING, description);
    },
} as const;
