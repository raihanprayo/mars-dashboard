import { Tabs } from "antd";
import { useSession } from "next-auth/react";

export function OrderSider(props: OrderSiderProps) {
    const session = useSession();
    const { order } = props;

    if (session.status !== "authenticated") return <></>;

    const assigments = order.assignments;
    const disableGaul = !order.gaul;
    const disableAssigment = assigments.length < 1;
    // .filter((e) => {
    //     return e.user.id !== session.data.user.id;
    // });

    return (
        <Tabs title="Detail Summaries">
            <Tabs.TabPane tab="Gangguan Ulang" key={1} disabled={disableGaul}>
                <TabContentGaul serviceno={order.serviceno} />
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

function TabContentGaul(props: { serviceno: string }) {
    return <></>;
}

function TabHistoryContent(props: { assignments: DTO.OrderAssignment[] }) {
    return <></>;
}
