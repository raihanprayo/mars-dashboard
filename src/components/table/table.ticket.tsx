import { HttpHeader } from "@mars/common";
import { Badge, Button, message, Table, Tag } from "antd";
import { ColumnType } from "antd/lib/table";
import { format } from "date-fns";
import axios, { AxiosResponse } from "axios";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
    const [orders, setOrders] = useState<DTO.OrdersDashboard>({
        counts: {} as any,
        orders: [],
    });

    const getOrders = (filters = filter) => {
        setLoading(true);
        return getData({ page, size, ...filters }, props.inbox)
            .then((res) => {
                const total = res.headers[HttpHeader.X_TOTAL_COUNT] || res.data.orders.length;

                console.log(res.data);
                if (res.data && Array.isArray(res.data.orders)) {
                    setTotal(Number(total));
                    setOrders(res.data);
                }
            })
            .catch((err) => {})
            .finally(() => setLoading(false));
    };
    const takeOrder = (id: string) => {
        return api
            .post("/order/take/" + id)
            .then((res) => message.success("Berhasil Mengambil order/tiket"))
            .catch((err) => {
                if (axios.isAxiosError(err)) {
                    const res = err.response as AxiosResponse<any, any>;
                    if (res) {
                        message.error(res.data.message || res.data);
                    } else message.error(err?.message);
                } else {
                    message.error(err?.message || err);
                }
            })
            .finally(() => {
                window.dispatchEvent(new Event("refresh-badge"));
                getOrders(filter);
            });
    };

    useEffect(() => {
        getOrders();
    }, [page, size]);

    const columns = useMemo(() => {
        const cols = Array(...TableTicketColms({ takeOrder }));
        if (props.inbox) {
            cols.pop();

            const orderNoCol = cols.find((e) => e.dataIndex === "orderno");
            orderNoCol.render = (v) => (
                <Link href={"/order/detail/" + v}>
                    <a>{v}</a>
                </Link>
            );
        } else {
            const orderNoCol = cols.find((e) => e.dataIndex === "orderno");
            delete orderNoCol.render;
        }
        return cols;
    }, []);

    const buttonSelect = (c: boolean) => (c ? "primary" : "dashed");
    return (
        <div className="workspace table-view">
            <div className="workspace-header">
                <div>
                    <Button
                        type={buttonSelect(!filter.producttype)}
                        onClick={() => {
                            const f = { ...filter };
                            delete f.producttype;
                            setFilter(f);
                            getOrders(f);
                        }}
                    >
                        All
                    </Button>
                    {Object.values(Mars.Product).map((e) => {
                        return (
                            <Badge count={orders.counts[e]}>
                                <Button
                                    type={buttonSelect(filter.producttype === e)}
                                    key={"button-" + e.toLowerCase()}
                                    style={{ marginLeft: 10 }}
                                    onClick={() => {
                                        const f = { ...filter };
                                        f.producttype = e;
                                        setFilter(f);
                                        getOrders(f);
                                    }}
                                >
                                    {e[0] + e.slice(1).toLowerCase()}
                                    {/* ({orders.counts[e]}) */}
                                </Button>
                            </Badge>
                        );
                    })}
                </div>
            </div>
            <Table
                size="small"
                loading={loading}
                dataSource={orders.orders}
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

const TableTicketColms = (props: TableTickerColumnOptions) => {
    const cols: ColumnType<DTO.Orders>[] = [
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
            render: (v, r) => {
                const tag = ColRender.orderStatus(v, true);

                return (
                    <>
                        {tag}
                        {r.gaul ? <Tag>GAUL</Tag> : null}
                    </>
                );
            },
        },
        {
            title: "Umur Tiket",
            align: "center",
            dataIndex: "opentime",
            render(value, record, index) {
                if (record.status === Mars.Status.CLOSED) return -1;
                return <Difference orderno={record.orderno} opentime={value} />;
            },
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
            title: "Tgl Masuk",
            align: "center",
            dataIndex: "opentime",
            render(value, record, index) {
                const d = new Date(value);
                const f = format(d, "EEEE, dd MMM yyyy - HH:mm:ss aa");
                return f;
            },
        },
        {
            title: "Action",
            align: "center",
            render(v, rec, index) {
                return (
                    <Button type="primary" onClick={() => props.takeOrder(rec.id)}>
                        Ambil
                    </Button>
                );
            },
        },
    ];
    return cols;
};

function getData(params: map = {}, inbox = false) {
    const url = "/order" + (inbox ? "/inbox" : "/dashboard");
    return api.get<DTO.OrdersDashboard>(url, {
        params,
    });
}

function Difference(props: { orderno: string | number; opentime: Date | string }) {
    const getTime = useCallback(() => {
        const { hour, minute } = ColRender.calcOrderAge(props.opentime);
        return `${hour}j ${minute}m`;
    }, []);

    const [time, setTime] = useState(getTime());

    useEffect(() => {
        const t = setInterval(() => setTime(getTime()), 60000);
        return () => clearInterval(t);
    }, []);

    return <span className="diff-time">{time}</span>;
}

interface TableTicketProps {
    inbox?: boolean;
}
interface TableTickerColumnOptions {
    takeOrder(id: string): void | Promise<void>;
}
