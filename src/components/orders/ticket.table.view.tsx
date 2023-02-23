import { EditOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { HttpHeader, isArr, isBool, isNull, isStr, Properties } from '@mars/common';
import { Form, Input, InputNumber, message, Select, Table } from 'antd';
import { TableRowSelection } from 'antd/lib/table/interface';
import axios, { AxiosResponse } from 'axios';
import { NextPageContext } from 'next';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useContext, useState, useMemo } from 'react';
import { MarsButton } from '_comp/base';
import { useContextMenu } from '_comp/context-menu';
import {
    BooleanInput,
    DateRangeFilter,
    TableTicketColms,
    THeader,
    TFilter,
} from '_comp/table';
import { PageContext, usePage } from '_ctx/page.ctx';
import { MarsTableProvider } from '_ctx/table.ctx';
import { usePageable } from '_hook/pageable.hook';
import { mapEnum } from '_utils/conversion';
import { RefreshBadgeEvent } from '_utils/events';
import { AddTicketDrawer } from './add-ticket.drawer.';

export function TicketTable(props: TicketTableProps) {
    const { data: tickets, products, total } = props.metadata;
    const router = useRouter();

    const page = usePage();
    const menu = useContextMenu<DTO.Ticket>();

    const { pageable, setPageable, updateSort } = usePageable([
        'createdAt',
        Pageable.Sorts.DESC,
    ]);
    const [formFilter] = Form.useForm<ICriteria<DTO.Ticket>>();
    const [productFilter, setProductFilter] = useState<Mars.Product[]>([]);
    const [openAddTicket, setOpenAddTicket] = useState(false);

    const [selected, setSelected] = useState<boolean[]>(
        Array(tickets?.length).fill(false)
    );
    const hasSelected = useMemo(() => {
        return selected.filter((e) => e).length !== 0;
    }, [selected]);

    const watchedProductFilter = Form.useWatch(
        ['product', 'in'],
        formFilter
    ) as Mars.Product[];

    const refresh = useCallback(() => {
        page.setLoading(true);

        const filter = formFilter.getFieldsValue();
        if (filter?.status?.in) filter.status.negated = false;

        return router
            .push({
                pathname: router.pathname,
                query: api.serializeParam({
                    page: pageable.page,
                    size: pageable.size,
                    sort:
                        pageable.sort === Pageable.Sorts.UNSORT
                            ? undefined
                            : pageable.sort,
                    ...filter,
                }),
            })
            .finally(() => page.setLoading(false));
    }, [pageable.page, pageable.size, pageable.sort, productFilter]);

    const takeOrder = useCallback((ticket: DTO.Ticket, bulk: boolean = false) => {
        return api
            .post('/ticket/wip/take/' + ticket.id)
            .then((res) => {
                if (!bulk) {
                    message.success('Berhasil mengambil tiket dengan no ' + ticket.no);
                    refresh();
                }
                return true;
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
                return false;
            })
            .finally(() => {
                if (!bulk) RefreshBadgeEvent.emit();
            });
    }, []);

    const bulkTakeOrder = useCallback(async () => {
        const t = selected.filter((s) => s).map((s, i) => tickets[i]);
        const tip = (n: number) => `Mengambil tiket ${n}/${t.length}`;

        page.setLoading(true, tip(0));

        let count = 0;
        for (const ticket of t) {
            count++;
            await takeOrder(ticket, true);
            page.setLoading(tip(count++));
        }

        page.setLoading(false);
        RefreshBadgeEvent.emit();
    }, [selected]);

    const onRowSelectionChange = useCallback(
        (keys: React.Key[], selectedRows: DTO.Ticket[]) => {
            const bools = [...selected];
            for (let index = 0; index < tickets.length; index++) {
                const dto = tickets[index];

                const isSelected = selectedRows.findIndex((e) => e.id === dto.id) !== -1;
                bools[index] = isSelected;
            }

            setSelected(bools);
        },
        []
    );

    useEffect(() => {
        menu.items = [
            {
                title: 'Ambil',
                onClick(event, item, data: DTO.Ticket) {
                    takeOrder(data);
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

        if (props.editorDrawer) {
            const duplicateGaulListener = (event: Event) => {
                setOpenAddTicket(true);
            };

            window.addEventListener('dup-ticket', duplicateGaulListener);
            return () => window.removeEventListener('dup-ticket', duplicateGaulListener);
        }
    }, []);

    useEffect(() => {
        setProductFilter(watchedProductFilter ?? []);
    }, [watchedProductFilter]);

    const actions = [
        props.withActionCol && (
            <THeader.Action
                icon={<EditOutlined />}
                disabledOnRole={MarsButton.disableIfAdmin}
                disabled={!hasSelected}
                title="Bulk Ambil"
                onClick={() => bulkTakeOrder()}
            >
                Ambil
            </THeader.Action>
        ),
        <THeader.Action
            pos="right"
            type="primary"
            title="Refresh"
            icon={<ReloadOutlined />}
            onClick={(e) => refresh()}
        />,
        <THeader.FilterAction
            pos="right"
            type="primary"
            title="Filter"
            icon={<FilterOutlined />}
        >
            Filter
        </THeader.FilterAction>,
    ].filter(isBool.non);

    const rowSelection: TableRowSelection<DTO.Ticket> = props.withActionCol
        ? {
              onChange: onRowSelectionChange,
          }
        : null;

    return (
        <MarsTableProvider refresh={refresh}>
            <div className="workspace table-view">
                <THeader children={actions} />
                <Table
                    size="small"
                    dataSource={tickets}
                    columns={TableTicketColms({
                        takeOrder,
                        pageable,
                        withActionCol: props.withActionCol,
                        withLinkToDetail: props.withLinkToDetail,
                        withCopyToDrawer: props.editorDrawer,
                    })}
                    pagination={{
                        total,
                        current: pageable.page + 1,
                        pageSize: pageable.size,
                        pageSizeOptions: [10, 20, 50, 100, 200],
                        hideOnSinglePage: false,
                        onChange(page, pageSize) {
                            if (pageable.page !== page - 1)
                                setPageable({ page: page - 1 });
                        },
                        onShowSizeChange(current, size) {
                            if (current !== size) setPageable({ size });
                        },
                    }}
                    onChange={(p, f, s, e) => {
                        if (e.action === 'sort') {
                            if (!isArr(s)) {
                                const { column, order, field } = s;
                                const f = !isArr(field) ? String(field) : field.join('.');
                                updateSort(f, order);
                            } else {
                                for (const sortProp of s) {
                                    const { column, order, field } = sortProp;
                                    const f = !isArr(field)
                                        ? String(field)
                                        : field.join('.');
                                    updateSort(f, order);
                                }
                            }
                        }
                    }}
                    // onRow={(rec, index) => ({
                    //     onContextMenu(event) {
                    //         if (props.customContextMenu) {
                    //             event.preventDefault();
                    //             menu.popup(event.clientX, event.clientY, rec);
                    //         }
                    //     },
                    // })}
                    rowSelection={rowSelection}
                />
                <TFilter form={formFilter} title="Tiket Filter">
                    {!props.inbox && (
                        <Form.Item label="Sedang Dikerjakan" name={['wip', 'eq']}>
                            <BooleanInput />
                        </Form.Item>
                    )}
                    <Form.Item label="Produk" name={['product', 'in']}>
                        <Select
                            mode="multiple"
                            options={mapEnum(Mars.Product)}
                            placeholder="produk (multi)"
                        />
                    </Form.Item>
                    <Form.Item label="Order No" name={['no', 'like']}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="STO" name={['sto', 'like']}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Witel" name={['witel', 'in']}>
                        <Select
                            mode="multiple"
                            options={mapEnum(Mars.Witel)}
                            placeholder="witel (multi)"
                        />
                    </Form.Item>
                    <Form.Item label="Tiket NOSSA" name={['incidentNo', 'like']}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Service No" name={['serviceNo', 'like']}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Status" name={['status', 'in']}>
                        <Select
                            mode="multiple"
                            options={mapEnum(Mars.Status)}
                            placeholder="status (multi)"
                        />
                    </Form.Item>
                    <Form.Item label="Sumber" name={['source', 'in']}>
                        <Select
                            mode="multiple"
                            options={mapEnum(Mars.Source)}
                            placeholder="sumber (multi)"
                        />
                    </Form.Item>
                    <Form.Item label="Gaul" name={['gaul', 'eq']}>
                        <BooleanInput />
                    </Form.Item>
                    <Form.Item label="Total Gaul" name={['gaulCount', 'eq']}>
                        <InputNumber />
                    </Form.Item>
                    <Form.Item label="Tanggal Dibuat" name="createdAt">
                        <DateRangeFilter />
                    </Form.Item>
                    <Form.Item label="Tanggal Diubah" name="updatedAt">
                        <DateRangeFilter />
                    </Form.Item>
                </TFilter>

                {props.editorDrawer && (
                    <AddTicketDrawer
                        open={openAddTicket}
                        onClose={() => setOpenAddTicket(false)}
                    />
                )}
            </div>
        </MarsTableProvider>
    );
}

TicketTable.getServerSideProps = function getServerSidePropsInitilizer(
    url: string,
    defaults: TicketTableGetOptions = {}
) {
    return async function getServerSideProps(ctx: NextPageContext) {
        const session = await getSession(ctx);

        const properties = new Properties({
            ...(defaults.pageable || {}),
            ...(defaults.filter || {}),
        });

        const config = api.auhtHeader(session, {
            params: {
                ...properties.inlined,
                ...ctx.query,
            },
        });

        console.log(config.params);

        const res = await api.manage<DTO.Ticket[]>(api.get(url, config));
        if (axios.isAxiosError(res)) {
            return api.serverSideError(res, res.response?.status);
        }

        const countHeader = (res.headers['tc-count'] || '').split(', ');
        const total = res.headers[HttpHeader.X_TOTAL_COUNT] || res.data.length;

        return {
            props: {
                data: res.data,
                total,
                products: {
                    [Mars.Product.INTERNET]: Number(countHeader[0] || 0),
                    [Mars.Product.IPTV]: Number(countHeader[1] || 0),
                    [Mars.Product.VOICE]: Number(countHeader[2] || 0),
                },
            },
        };
    };
};

export interface TicketTableProps {
    metadata: TicketPageMetadata;
    inbox?: boolean;

    withActionCol?: boolean;
    withLinkToDetail?: boolean;
    editAbleDetail?: boolean;

    editorDrawer?: boolean;
    customContextMenu?: boolean;
}
export interface TicketTableGetOptions {
    pageable?: Partial<Pageable>;
    filter?: ICriteria<DTO.Ticket>;
}
export interface TicketPageMetadata {
    data: DTO.Ticket[];
    total: number;
    products: Record<Mars.Product, number>;

    error?: any;
}
