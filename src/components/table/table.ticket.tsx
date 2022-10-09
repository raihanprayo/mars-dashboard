import { HttpHeader, isDefined } from '@mars/common';
import { Badge, Button, Menu, message, Table, Tag } from 'antd';
import { ColumnType, TablePaginationConfig } from 'antd/lib/table';
import { ColumnFilterItem, FilterValue } from 'antd/lib/table/interface';
import { format } from 'date-fns';
import axios, { AxiosError, AxiosResponse } from 'axios';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePageable } from '_hook/pageable.hook';
import { RefreshBadgeEvent } from '_utils/events';
import { Render } from '../value-renderer';

export default TableTicket;
function TableTicket(props: TableTicketProps) {
    const { pageable, setPageable } = usePageable();
    const { size, page } = pageable;

    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<ICriteria<DTO.Orders>>({});
    const [orders, setOrders] = useState<DTO.OrdersDashboard>({
        counts: {} as any,
        orders: [],
    });

    console.log('Current Filter', filter);
    const getOrders = (filters = filter) => {
        console.log(filter);
        setLoading(true);
        return getData(
            { page: pageable.page, size: pageable.size, ...filters },
            props.inbox
        )
            .then((res) => {
                const total =
                    res.headers[HttpHeader.X_TOTAL_COUNT] || res.data.orders.length;

                console.log(res.data);
                if (res.data && Array.isArray(res.data.orders)) {
                    setTotal(Number(total));
                    setOrders(res.data);
                }
            })
            .catch((err: AxiosError) => {
                if (axios.isAxiosError(err)) {
                    console.error(err);
                    message.error(`${err.code}: ${err.message}`);
                }
            })
            .finally(() => {
                setLoading(false);
                RefreshBadgeEvent.emit();
            });
    };
    const takeOrder = (id: string) => {
        return api
            .post('/order/take/' + id)
            .then((res) => {
                message.success('Berhasil Mengambil order/tiket');
                getOrders(filter);
            })
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
                RefreshBadgeEvent.emit();
            });
    };

    const filterFns = useCallback(
        (t: TablePaginationConfig, f: map<FilterValue>, s: any) => {
            const nf = { ...filter };
            if (!isDefined(f.status)) {
                delete nf.status;
                delete nf.gaul;
            } else {
                if (f.status.includes('GAUL')) {
                    nf.gaul = { gte: 1 };
                }

                const inFilter = [...f.status] as string[];
                if (inFilter.includes('GAUL'))
                    inFilter.splice(inFilter.indexOf('GAUL'), 1);

                nf.status = { in: inFilter as any };
            }

            if (!isDefined(f.witel)) delete nf.witel;
            else nf.witel = { eq: f.witel as any };

            setFilter(nf);
        },
        [filter]
    );

    useEffect(() => {
        getOrders(filter);
    }, [page, size, filter]);

    const columns = useMemo(() => {
        const cols = TableTicketColms({ takeOrder });
        if (props.inbox) {
            cols.pop();

            const orderNoCol = cols.find((e) => e.dataIndex === 'orderno');
            orderNoCol.render = (v) => (
                <Link href={'/order/detail/' + v}>
                    <a>{v}</a>
                </Link>
            );
        } else {
            const orderNoCol = cols.find((e) => e.dataIndex === 'orderno');
            delete orderNoCol.render;
        }
        return cols;
    }, []);

    const buttonSelect = (c: boolean) => (c ? 'primary' : 'dashed');
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
                                    type={buttonSelect(
                                        filter.producttype && filter.producttype.eq === e
                                    )}
                                    key={'button-' + e.toLowerCase()}
                                    style={{ marginLeft: 10 }}
                                    onClick={() => {
                                        const f = { ...filter };
                                        f.producttype = { eq: e };
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
                    onChange(page, pageSize) {
                        if (pageable.page !== page - 1) setPageable({ page: page - 1 });
                    },
                    onShowSizeChange(current, size) {
                        if (current !== size) setPageable({ size });
                    },
                }}
                onChange={filterFns}
            />
        </div>
    );
}

const TableTicketColms = (props: TableTickerColumnOptions) => {
    const cols: ColumnType<DTO.Orders>[] = [
        {
            title: 'No',
            width: 40,
            align: 'center',
            render: (v, r, i) => <b>{`${i + 1}`}</b>,
        },
        {
            title: 'Order ID',
            align: 'center',
            dataIndex: 'orderno',
            filterSearch: true,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            align: 'center',
            render: (v, r) => {
                const tag = Render.orderStatus(v, true);

                return (
                    <>
                        {tag}
                        {r.gaul ? <Tag>GAUL</Tag> : null}
                    </>
                );
            },
            filterMode: 'tree',
            filters: Object.keys(Mars.Status)
                .filter((e) => e !== Mars.Status.PROGRESS)
                .concat('GAUL')
                .map((e) => {
                    return {
                        text: e,
                        value: e,
                    };
                }),
        },
        {
            title: 'Umur Tiket',
            align: 'center',
            dataIndex: 'opentime',
            render(value, record, index) {
                if (record.status === Mars.Status.CLOSED) return -1;
                return <Difference orderno={record.orderno} opentime={value} />;
            },
        },
        {
            title: 'Service No',
            align: 'center',
            dataIndex: 'serviceno',
        },
        {
            title: 'Product',
            align: 'center',
            dataIndex: 'producttype',
            render: Render.product,
        },
        {
            title: 'Source',
            align: 'center',
            dataIndex: 'ordersource',
            render: Render.orderSource,
        },
        {
            title: 'Keterangan',
            align: 'center',
            dataIndex: 'ordertext',
        },
        {
            title: 'Witel',
            align: 'center',
            dataIndex: 'witel',
            filters: Object.keys(Mars.Witel).map((e) => ({
                text: e,
                value: e,
            })),
        },
        {
            title: 'STO',
            align: 'center',
            dataIndex: 'sto',
        },
        {
            title: 'Tgl Masuk',
            align: 'center',
            dataIndex: 'opentime',
            render(value, record, index) {
                const d = new Date(value);
                const f = format(d, 'EEEE, dd MMM yyyy - HH:mm:ss aa');
                return f;
            },
        },
        {
            title: 'Action',
            align: 'center',
            render(v, rec, index) {
                const disabled = [Mars.Status.CONFIRMATION, Mars.Status.CLOSED].includes(
                    rec.status
                );
                return (
                    <Button
                        type="primary"
                        onClick={() => props.takeOrder(rec.id)}
                        disabled={disabled}
                    >
                        Ambil
                    </Button>
                );
            },
        },
    ];
    return cols;
};

function getData(params: map = {}, inbox = false) {
    const url = '/order' + (inbox ? '/inbox' : '/dashboard');
    return api.get<DTO.OrdersDashboard>(url, {
        params,
    });
}

function Difference(props: { orderno: string | number; opentime: Date | string }) {
    const getTime = useCallback(() => {
        const { hour, minute } = Render.calcOrderAge(props.opentime);
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
