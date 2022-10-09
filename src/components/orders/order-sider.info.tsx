import { List, Tabs, Typography } from 'antd';
import { AxiosError } from 'axios';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Render } from '_comp/value-renderer';
import { doRender } from '_utils/fns/should-render';

export function OrderSider(props: OrderSiderProps) {
    const session = useSession();
    const { order } = props;

    if (session.status !== 'authenticated') return <></>;

    const [others, setOthers] = useState<DTO.Orders[]>([]);
    const assigments = order.assignments;
    const disableGaul = order.gaul === 0;
    const disableAssigment = assigments.length < 1;

    useEffect(() => {
        if (!disableGaul) {
            getOrderByServiNo(order.id, order.serviceno)
                .then((res) => setOthers(res.data))
                .catch((err: AxiosError) => {
                    const { response } = err;
                });
        }
    }, []);

    const gaulTab = doRender(
        !disableGaul,
        <Tabs.TabPane tab="Gangguan Ulang" key="tab:gaul-1">
            <TabContentGaul orders={others} />
        </Tabs.TabPane>
    );

    const historyTab = doRender(
        !disableAssigment,
        <Tabs.TabPane tab="History" key="tab:history-2">
            <TabHistoryContent assignments={order.assignments} />
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
    order: DTO.Orders;
}

function TabContentGaul(props: { orders: DTO.Orders[] }) {
    return (
        <List>
            {props.orders.map((order) => {
                return (
                    <List.Item>
                        <div>
                            <Typography.Title level={5}>
                                Order No: {order.orderno}
                            </Typography.Title>
                        </div>
                        <div>
                            <Typography.Text></Typography.Text>
                        </div>
                    </List.Item>
                );
            })}
        </List>
    );
}

function TabHistoryContent(props: { assignments: DTO.OrderAssignment[] }) {
    return (
        <List
            className="order-sider history"
            size="large"
            itemLayout="horizontal"
            dataSource={props.assignments.filter(
                (e) => e.status !== Mars.AssignStatus.PROGRESS
            )}
            renderItem={TabHistoryContent.Item}
        />
    );
}
TabHistoryContent.Item = function (agent: DTO.OrderAssignment, index: number) {
    console.log(agent);
    return (
        <List.Item className="order-sider-item">
            <List.Item.Meta
                title={
                    <>
                        {agent.user.nik} | {agent.user.name}
                    </>
                }
                description={
                    <>
                        <div className="item update-at">
                            <span>
                                {format(
                                    new Date(agent.updatedAt),
                                    'dd/MM/yyyy, HH:mm:ss'
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
        </List.Item>
    );
};

function getOrderByServiNo(currentOrderId: string, serviceno: string) {
    return api.get<DTO.Orders[]>('/order', {
        params: {
            serviceno: { eq: serviceno },
            gaul: { gt: 0 },
            id: { negate: true, eq: currentOrderId },
            sort: {
                opentime: Pageable.Sorts.DESC,
            },
        },
    });
}
