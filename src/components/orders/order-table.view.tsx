import { ReloadOutlined } from '@ant-design/icons';
import { HttpHeader } from '@mars/common';
import { message, Table } from 'antd';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { useRouter } from 'next/router';
import { useState, useCallback, useEffect } from 'react';
import { useContextMenu } from '_comp/context-menu';
import { usePageable } from '_hook/pageable.hook';
import { RefreshBadgeEvent } from '_utils/events';
import { TableTicketColms } from '../table/table.definitions';
import { THeader } from '../table/table.header';

export {};

export function OrderTable(props: OrderTableProps) {
    const route = useRouter();
    const menu = useContextMenu<DTO.Orders>();
    const { pageable, setPageable } = usePageable();
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState<ICriteria<DTO.Orders>>({});
    const [orders, setOrders] = useState<DTO.OrdersDashboard>({
        counts: {} as any,
        orders: [],
    });

    // const [coordinate, setCoordinate] = useState<ContextMenuProps>({ x: 0, y: 0 });

    const getOrders = useCallback((filters: ICriteria<DTO.Orders> = {}) => {
        setLoading(true);
        return api
            .get(props.url, {
                params: { page: pageable.page, size: pageable.size, ...filters },
            })
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
    }, []);

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

    useEffect(() => {
        menu.items = [
            {
                title: 'Ambil',
                onClick(event, item, data: DTO.Orders) {
                    takeOrder(data.id);
                },
                disable(data) {
                    return (
                        !!data &&
                        [Mars.Status.CONFIRMATION, Mars.Status.CLOSED].includes(
                            data.status
                        )
                    );
                },
            },
        ];
    }, []);

    useEffect(() => {
        getOrders(filter);
    }, [pageable.page, pageable.size, filter]);

    const buttonSelect = (c: boolean) => (c ? 'primary' : 'dashed');
    const actions = [
        <THeader.Action
            type={buttonSelect(!filter.producttype)}
            onClick={(e) => {
                const f = { ...filter };
                delete f.producttype;
                delete route.query.producttype;
                setFilter(f);

                route.replace({
                    pathname: route.asPath,
                    query: Object.assign(route.query, { ...f }),
                });
            }}
        >
            All
        </THeader.Action>,
        ...Object.values(Mars.Product).map((e, i) => (
            <THeader.Action
                key={'category-' + i}
                style={{ marginLeft: 10 }}
                badge={orders.counts[e]}
                title={`Filter Product: ${e}`}
                type={buttonSelect(filter.producttype && filter.producttype.eq === e)}
                onClick={() => {
                    const f = { ...filter };
                    f.producttype = { eq: e };
                    setFilter(f);
                }}
            >
                {e[0] + e.slice(1).toLowerCase()}
            </THeader.Action>
        )),
        <THeader.Action
            pos="right"
            type="primary"
            title="Refresh"
            icon={<ReloadOutlined />}
            onClick={(e) => getOrders(filter)}
        />,
    ];

    return (
        <div className="workspace table-view">
            <THeader children={actions} />
            <Table
                size="small"
                loading={loading}
                dataSource={orders.orders}
                columns={TableTicketColms({
                    takeOrder,
                    withActionCol: props.withActionCol,
                    withLinkToDetail: props.withLinkToDetail,
                })}
                pagination={{
                    total,
                    current: pageable.page + 1,
                    pageSize: pageable.size,
                    pageSizeOptions: [10, 20, 50, 100, 200],
                    hideOnSinglePage: false,
                    onChange(page, pageSize) {
                        if (pageable.page !== page - 1) setPageable({ page: page - 1 });
                    },
                    onShowSizeChange(current, size) {
                        if (current !== size) setPageable({ size });
                    },
                }}
                onRow={(rec, index) => ({
                    onContextMenu(event) {
                        if (props.customContextMenu) {
                            event.preventDefault();
                            menu.popup(event.clientX, event.clientY, rec);
                        }
                    },
                })}
            />
        </div>
    );
}

export interface OrderTableProps {
    url: string;
    withActionCol?: boolean;
    withLinkToDetail?: boolean;
    customContextMenu?: boolean;
}
