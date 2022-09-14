import { HttpHeader, upperCase } from "@mars/common";
import { Button, Table } from "antd";
import { ColumnType } from "antd/lib/table";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePageable } from "_hook/pageable.hook";
import { ColRender } from "./table.value";

export default TableTicket;
function TableTicket(props: TableTicketProps) {
    const {
        pageable: { page, size },
        setPageable,
    } = usePageable();
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<Partial<DTO.Orders>>({});
    const [orders, setOrders] = useState<DTO.Orders[]>([]);

    useEffect(() => {
        setLoading(true);
        getData({ page, size, ...filter }, props.inbox)
            .then((res) => {
                const total = res.headers[HttpHeader.X_TOTAL_COUNT] || res.data.length;

                console.log(res.data);
                if (Array.isArray(res.data)) {
                    setTotal(Number(total));
                    setOrders(res.data);
                }
            })
            .catch((err) => {})
            .finally(() => setLoading(false));
    }, [page, size]);

    const columns = useMemo(() => {
        const cols = Array(...TableTicketColms);
        if (props.inbox) {
            cols.pop();

            const orderNoCol = cols.find((e) => e.dataIndex === "orderno");
            orderNoCol.render = (v) => (
                <Link href={"/detail/" + v}>
                    <a>{v}</a>
                </Link>
            );
        } else {
            const orderNoCol = cols.find((e) => e.dataIndex === "orderno");
            delete orderNoCol.render;
        }
        return cols;
    }, []);

    return (
        <div className="workspace table-view">
            <div className="workspace-header">
                <Button type="text">All</Button>
                {Object.values(Mars.Product).map((e) => {
                    return (
                        <Button type="text" key={"button-" + e.toLowerCase()}>
                            {e[0] + e.slice(1).toLowerCase()}
                        </Button>
                    );
                })}
            </div>
            <Table
                size="small"
                loading={loading}
                dataSource={orders}
                columns={columns}
                pagination={{
                    total,
                    current: page + 1,
                    pageSize: size,
                    pageSizeOptions: [10, 20, 50, 100, 200],
                    hideOnSinglePage: false,
                }}
            />
        </div>
    );
}

const TableTicketColms: ColumnType<DTO.Orders>[] = [
    {
        title: "No",
        width: 40,
        align: "center",
        render: (v, r, i) => <b>{`${i + 1}`}</b>,
    },
    {
        title: "Order ID",
        align: "center",
        dataIndex: "orderno",
    },
    {
        title: "Status",
        dataIndex: "status",
        align: "center",
        render: ColRender.orderStatus,
    },
    {
        title: "Service No",
        align: "center",
        dataIndex: "serviceno",
    },
    {
        title: "Product",
        align: "center",
        dataIndex: "producttype",
        render: ColRender.product,
    },
    {
        title: "Source",
        align: "center",
        dataIndex: "ordersource",
    },
    {
        title: "Keterangan",
        align: "center",
        dataIndex: "ordertext",
    },
    {
        title: "Witel",
        align: "center",
        dataIndex: "witel",
    },
    {
        title: "STO",
        align: "center",
        dataIndex: "sto",
    },
    {
        title: "Action",
        align: "center",
        render() {
            return <Button type="primary">Ambil</Button>;
        },
    },
];

function getData(params: map = {}, inbox = false) {
    const url = "/order" + (inbox ? "/inbox" : "");
    return api.get<DTO.Orders[]>(url, {
        params,
    });
}

interface TableTicketProps {
    inbox?: boolean;
}
