import { List, Tabs, Typography } from 'antd';
import { AxiosError } from 'axios';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function OrderSider(props: OrderSiderProps) {
    const session = useSession();
    const { order } = props;

    if (session.status !== 'authenticated') return <></>;

    const [others, setOthers] = useState<DTO.Orders[]>([]);
    const assigments = order.assignments;
    const disableGaul = !order.gaul;
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

    return (
        <Tabs title="Detail Summaries">
            <Tabs.TabPane tab="Gangguan Ulang" key={1} disabled={disableGaul}>
                <TabContentGaul orders={others} />
            </Tabs.TabPane>
            <Tabs.TabPane tab="History" key={2} disabled={disableAssigment}>
                <TabHistoryContent assignments={order.assignments} />
            </Tabs.TabPane>
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
    return <></>;
}

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
