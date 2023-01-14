import { ReloadOutlined } from '@ant-design/icons';
import { HttpHeader } from '@mars/common';
import { message, Table } from 'antd';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useCallback, useEffect, useContext } from 'react';
import { useContextMenu } from '_comp/context-menu';
import { PageContext } from '_ctx/page.ctx';
import { usePageable } from '_hook/pageable.hook';
import { RefreshBadgeEvent } from '_utils/events';
import { TableTicketColms } from '../table/table.definitions';
import { THeader } from '../table/table.header';

export {};

const defaultStatusFilter = [
    Mars.Status.OPEN,
    Mars.Status.CONFIRMATION,
    Mars.Status.DISPATCH,
    Mars.Status.REOPEN,
    Mars.Status.PENDING,
];
export function TicketTable(props: OrderTableProps) {
    const route = useRouter();
    const session = useSession();

    const {loading, setLoading} = useContext(PageContext);
    const menu = useContextMenu<DTO.Ticket>();

    const { pageable, setPageable } = usePageable(['createdAt', Pageable.Sorts.DESC]);
    const [filter, setFilter] = useState<ICriteria<DTO.Ticket>>(
        props.defaultFilter || {}
    );
    const [total, setTotal] = useState(0);
    const [products, setProducts] = useState<Record<Mars.Product, number>>({} as any);
    const [tickets, setOrders] = useState<DTO.Ticket[]>([]);

    // const [coordinate, setCoordinate] = useState<ContextMenuProps>({ x: 0, y: 0 });

    const getTickets = useCallback((filters: ICriteria<DTO.Ticket> = {}) => {
        setLoading(true);

        return api
            .get<DTO.Ticket[]>(props.url, {
                params: {
                    ...pageable,
                    ...filters,
                },
            })
            .then((res) => {
                console.log('Get Ticket Header', res.headers);
                const total = res.headers[HttpHeader.X_TOTAL_COUNT] || res.data.length;

                const countHeader = (res.headers['tc-count'] || '').split(', ');

                console.log('Response Data', res.data);
                if (res.data && Array.isArray(res.data)) {
                    setTotal(Number(total));
                    setOrders(res.data);
                }

                setProducts({
                    [Mars.Product.INTERNET]: Number(countHeader[0] || 0),
                    [Mars.Product.IPTV]: Number(countHeader[1] || 0),
                    [Mars.Product.VOICE]: Number(countHeader[2] || 0),
                });
            })
            .catch((err) => {
                console.error(err);
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
            .post('/ticket/wip/take/' + id)
            .then((res) => {
                message.success('Berhasil Mengambil order/tiket');
                getTickets(filter);
            })
            .catch((err) => {
                console.error(err);
                if (axios.isAxiosError(err)) {
                    const res = err.response as AxiosResponse<any, any>;
                    if (res && res.data) {
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
                onClick(event, item, data: DTO.Ticket) {
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
        if (session.status === 'authenticated') {
            getTickets(filter);
        }
    }, [pageable.page, pageable.size, filter, session.status]);

    const buttonSelect = (c: boolean) => (c ? 'primary' : 'dashed');
    const actions = [
        <THeader.Action
            type={buttonSelect(!filter.product)}
            onClick={(e) => {
                const f = { ...filter };
                delete f.product;
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
                badge={products[e] ?? 0}
                title={`Filter Product: ${e}`}
                type={buttonSelect(filter.product && filter.product.eq === e)}
                onClick={() => {
                    const f = { ...filter };
                    f.product = { eq: e };
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
            onClick={(e) => getTickets(filter)}
        />,
    ];

    return (
        <div className="workspace table-view">
            <THeader children={actions} />
            <Table
                size="small"
                dataSource={tickets}
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
    inbox?: boolean;

    withActionCol?: boolean;
    withLinkToDetail?: boolean;
    customContextMenu?: boolean;

    defaultFilter?: ICriteria<DTO.Ticket>;
}
