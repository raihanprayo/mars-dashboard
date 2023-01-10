import { Button, Divider, List, Tabs, Typography } from 'antd';
import { AxiosError } from 'axios';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Render } from '_comp/value-renderer';
import { doRender } from '_utils/fns/should-render';
import ThumbnailDrawer from '../thumbnail.drawer';

export function OrderSider(props: OrderSiderProps) {
    const session = useSession();
    const { order } = props;

    if (session.status !== 'authenticated') return <></>;

    const [others, setOthers] = useState<DTO.Ticket[]>([]);
    const [agents, setAgents] = useState<DTO.TicketAgent[]>([]);
    const disableGaul = !order.gaul;
    const disableAssigment = agents.length < 1;

    useEffect(() => {
        if (!disableGaul) {
            getOrderByServiNo(order.id, order.serviceno)
                .then((res) => setOthers(res.data))
                .catch((err: AxiosError) => {})
                .finally(() => console.log(others));
        }
    }, []);

    const gaulTab = doRender(
        !disableGaul,
        <Tabs.TabPane tab={<b>Gangguan Ulang</b>} key="tab:gaul-1">
            <TabContentGaul orders={others} />
        </Tabs.TabPane>
    );

    const historyTab = doRender(
        !disableAssigment,
        <Tabs.TabPane tab={<b>History</b>} key="tab:history-2">
            <TabHistoryContent assignments={agents} />
        </Tabs.TabPane>
    );

    return (
        <Tabs title="Detail Summaries">
            {gaulTab}
            {historyTab}
        </Tabs>
    );
}

export interface OrderSiderProps {
    order: DTO.Ticket;
}

function TabContentGaul(props: { orders: DTO.Ticket[] }) {
    return (
        <List
            className="order-sider"
            size="large"
            itemLayout="horizontal"
            dataSource={props.orders}
            renderItem={TabContentGaul.Item}
        />
    );
}
TabContentGaul.Item = function (order: DTO.Ticket, index: number) {
    return (
        <List.Item className="order-sider-item">
            <List.Item.Meta
                title={
                    <Link className='item title' href={`/order/detail/${order.no}`}>
                        Order {order.no}
                    </Link>
                }
                description={
                    <>
                        <div className="item update-at">
                            open{' '}
                            {format(new Date(order.createdAt), 'dd/MM/yyyy, HH:mm:ss')}
                        </div>
                        <div className="item status right">
                            <span>{order.status}</span>
                        </div>
                    </>
                }
            />
            <div>
                <Typography.Text></Typography.Text>
            </div>
        </List.Item>
    );
};

function TabHistoryContent(props: { assignments: DTO.TicketAgent[] }) {
    return (
        <List
            className="order-sider history"
            size="large"
            itemLayout="horizontal"
            dataSource={props.assignments.filter(
                (e) => e.status !== Mars.AgentStatus.PROGRESS
            )}
            renderItem={TabHistoryContent.Item}
        />
    );
}
TabHistoryContent.Item = function (agent: DTO.TicketAgent, index: number) {
    const thumbCtx = ThumbnailDrawer.useDrawer();
    return (
        <List.Item
            className="order-sider-item"
            onClick={() => {
                thumbCtx.open([...agent.files]);
            }}
        >
            <List.Item.Meta
                title={
                    <span className="item title">
                        Agent {agent.user.nik} ({agent.user.name})
                    </span>
                }
                description={
                    <>
                        <div className="item update-at">
                            <span>
                                {format(
                                    new Date(agent.updatedAt),
                                    Render.DATE_WITHOUT_TIMESTAMP
                                )}
                            </span>
                        </div>
                        <div className="item status right">
                            <span>{agent.status}</span>
                        </div>
                    </>
                }
            />
            {agent.description || '(no description)'}
            <Divider className="order-sider-divider" />
            <a className="file-info" href="javascript:void(0)">
                {agent.files.length} attachment(s)
            </a>
        </List.Item>
    );
};

function getOrderByServiNo(currentOrderId: string, serviceno: string) {
    return api.get<DTO.Ticket[]>('/api/ticket', {
        params: {
            id: { negate: true, eq: currentOrderId },
            serviceNo: { eq: serviceno },
            sort: ["createdAt", Pageable.Sorts.DESC],
        },
    });
}
