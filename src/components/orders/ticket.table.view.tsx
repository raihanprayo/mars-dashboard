import {
    BugOutlined,
    EditOutlined,
    FilterOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import {
    HttpHeader,
    isArr,
    isBool,
    isFn,
    isNull,
    isStr,
    Properties,
} from "@mars/common";
import {
    Form,
    Input,
    InputNumber,
    message,
    Popover,
    Select,
    Space,
    Table,
} from "antd";
import type { TableRowSelection } from "antd/lib/table/interface";
import axios, { AxiosResponse } from "axios";
import { NextPageContext } from "next";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
import {
    useCallback,
    useEffect,
    useContext,
    useState,
    useMemo,
    useRef,
} from "react";
import { MarsButton } from "_comp/base";
import { useContextMenu } from "_comp/context-menu";
import {
    BooleanInput,
    DateRangeFilter,
    TableTicketColms,
    THeader,
    TFilter,
} from "_comp/table";
import { PageContext, usePage } from "_ctx/page.ctx";
import {
    MarsTablePagination,
    MarsTableProvider,
    MarsTableSorter,
} from "_ctx/table.ctx";
import { usePageable } from "_hook/pageable.hook";
import { mapEnum } from "_utils/conversion";
import { RefreshBadgeEvent } from "_utils/events";
import { AddTicketDrawer } from "./add-ticket.drawer.";
import { ParsedUrlQuery } from "querystring";
import { Pageable } from "@mars/common/types/enums";
import { Mars } from "@mars/common/types/mars";
import MarsTable from "_comp/table/table";
import { useBool } from "_hook/util.hook";
import notif from "_service/notif";

type TimeUnit = "s" | "m" | "h";
interface AutoRefresh {
    time: number;
    unit: TimeUnit;
}

const unitConversion = (u: TimeUnit) =>
    u === "h" ? "jam" : u === "m" ? "menit" : "detik";

export function TicketTable(props: TicketTableProps) {
    const { data: tickets, products, total } = props.metadata;
    const router = useRouter();

    const page = usePage();
    const menu = useContextMenu<DTO.Ticket>();

    const { pageable, setPageable, updateSort } = usePageable([
        "createdAt",
        Pageable.Sorts.DESC,
    ]);
    const [formFilter] = Form.useForm<ICriteria<DTO.Ticket>>();
    const [productFilter, setProductFilter] = useState<Mars.Product[]>([]);
    const [openAddTicket, setOpenAddTicket] = useState(false);
    const loadingFixPending = useBool();

    const [autoRefreshRate, setAutorRefreshRate] = useState<AutoRefresh>({
        time: 0,
        unit: "m",
    });
    const autoRefreshRef = useRef<NodeJS.Timer>(null);

    const [selected, setSelected] = useState<string[]>([]);
    const hasSelected = useMemo(() => selected.length > 0, [selected]);

    const watchedProductFilter = Form.useWatch(
        ["product", "in"],
        formFilter
    ) as Mars.Product[];

    const refresh = useCallback(() => {
        page.setLoading(true);

        const filter = formFilter.getFieldsValue();
        // filter.sta
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

    const takeOrder = useCallback(
        (ticket: DTO.Ticket, bulk: boolean = false) => {
            return api
                .post("/ticket/wip/take/" + ticket.id)
                .then((res) => {
                    if (!bulk) {
                        message.success(
                            "Berhasil mengambil tiket dengan no " + ticket.no
                        );
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
        },
        []
    );

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

    const onRefreshRateChange = (opt: Partial<AutoRefresh>) => {
        // const rate = Number(element.value);
        const newRefreshRate = {
            ...autoRefreshRate,
            ...opt,
        };
        localStorage.setItem(
            "inbox-refresh-rate",
            JSON.stringify(newRefreshRate)
        );
        setAutorRefreshRate(newRefreshRate);
    };

    const fixPendingTicket = () => {
        loadingFixPending.setValue(true);
        api.get('/ticket/resend/pending')
            .catch(err => notif.axiosError(err))
            .finally(() => loadingFixPending.setValue(false));
    }

    useEffect(() => {
        menu.items = [
            {
                title: "Ambil",
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

            window.addEventListener("dup-ticket", duplicateGaulListener);
            return () =>
                window.removeEventListener("dup-ticket", duplicateGaulListener);
        }

        const refreshRateItem = localStorage.getItem("inbox-refresh-rate");
        if (refreshRateItem != null)
            setAutorRefreshRate(JSON.parse(refreshRateItem));
    }, []);

    useEffect(() => {
        setProductFilter(watchedProductFilter ?? []);
    }, [watchedProductFilter]);

    useEffect(() => {
        if (autoRefreshRate.time > 0) {
            let time = 0;
            switch (autoRefreshRate.unit) {
                case "h":
                    time = 1000 * 60 * 60 * autoRefreshRate.time;
                    break;
                case "m":
                    time = 1000 * 60 * autoRefreshRate.time;
                    break;
                case "s":
                    time = 1000 * autoRefreshRate.time;
                    break;
            }

            autoRefreshRef.current = setInterval(() => refresh(), time);
            return () => clearInterval(autoRefreshRef.current);
        }
    }, [autoRefreshRate]);

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
        props.withFixPending && (
            <THeader.Action
                pos="right"
                icon={<BugOutlined />}
                title="Resend Pending Ticket"
                loading={loadingFixPending.value}
                onClick={() => fixPendingTicket()}
            />
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
        props.withAutoRefreshData && (
            <THeader.Item>
                <Space>
                    <span style={{ fontWeight: 650 }}>Auto Refresh:</span>
                    <Popover
                        content={`Refresh Rate ${
                            autoRefreshRate.time
                        } ${unitConversion(autoRefreshRate.unit)}`}
                        placement="bottom"
                    >
                        <Input
                            type="number"
                            value={autoRefreshRate.time}
                            style={{ width: 80 }}
                            onChange={(e) =>
                                onRefreshRateChange({
                                    time: Number(e.currentTarget.value),
                                })
                            }
                        />
                    </Popover>
                    <Select
                        value={autoRefreshRate.unit}
                        onChange={(e) => onRefreshRateChange({ unit: e })}
                        options={[
                            { label: "Jam", value: "h" },
                            { label: "Menit", value: "m" },
                            { label: "Detik", value: "s" },
                        ]}
                    />
                </Space>
            </THeader.Item>
        ),
    ].filter(isBool.non);

    const rowSelection: TableRowSelection<DTO.Ticket> = {
        selectedRowKeys: selected,
        onChange(selectedRowKeys, selectedRows, info) {
            setSelected(selectedRows.map((e, i) => e.id));
        },
    };

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
                    pagination={MarsTablePagination({
                        total,
                        pageable,
                        setPageable,
                    })}
                    onChange={MarsTableSorter({ updateSort })}
                    rowSelection={props.withActionCol && rowSelection}
                />
                <TFilter form={formFilter} title="Tiket Filter">
                    {!props.inbox && (
                        <Form.Item
                            label="Sedang Dikerjakan"
                            name={["wip", "eq"]}
                        >
                            <BooleanInput />
                        </Form.Item>
                    )}
                    <Form.Item label="Produk" name={["product", "in"]}>
                        <Select
                            mode="multiple"
                            options={mapEnum(Mars.Product)}
                            placeholder="produk (multi)"
                        />
                    </Form.Item>
                    <Form.Item label="Order No" name={["no", "like"]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="STO" name={["sto", "like"]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Witel" name={["witel", "in"]}>
                        <Select
                            mode="multiple"
                            options={mapEnum(Mars.Witel)}
                            placeholder="witel (multi)"
                        />
                    </Form.Item>
                    <Form.Item
                        label="Tiket NOSSA"
                        name={["incidentNo", "like"]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item label="Service No" name={["serviceNo", "like"]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Status" name={["status", "in"]}>
                        <Select
                            mode="multiple"
                            options={mapEnum(Mars.Status)}
                            placeholder="status (multi)"
                        />
                    </Form.Item>
                    <Form.Item label="Sumber" name={["source", "in"]}>
                        <Select
                            mode="multiple"
                            options={mapEnum(Mars.Source)}
                            placeholder="sumber (multi)"
                        />
                    </Form.Item>
                    <Form.Item label="Gaul" name={["gaul", "eq"]}>
                        <BooleanInput />
                    </Form.Item>
                    <Form.Item label="Total Gaul" name={["gaulCount", "eq"]}>
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
    defaults: TicketTableGetUnion = {}
) {
    return async function getServerSideProps(ctx: NextPageContext) {
        const session = await getSession(ctx);

        const defaultOptions = !isFn(defaults) ? defaults : defaults(ctx.query);

        const properties = new Properties({
            ...(defaultOptions.pageable || {}),
            ...(defaultOptions.filter || {}),
        });

        const config = api.auhtHeader(session, {
            params: {
                page: 0,
                size: 50,
                ...properties.inlined,
                ...ctx.query,
            },
        });

        const res = await api.manage<DTO.Ticket[]>(api.get(url, config));
        if (axios.isAxiosError(res)) {
            return api.serverSideError(res, res.response?.status);
        }

        const countHeader = (res.headers["tc-count"] || "").split(", ");
        const total = res.headers[HttpHeader.X_TOTAL_COUNT] || res.data.length;

        return {
            props: {
                data: res.data.map((e) => ({ key: e.id, ...e })),
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
    withFixPending?: boolean;

    withLinkToDetail?: boolean;
    withAutoRefreshData?: boolean;
    editAbleDetail?: boolean;

    editorDrawer?: boolean;
    customContextMenu?: boolean;
}
export interface TicketTableGetOptions {
    pageable?: Partial<Pageable>;
    filter?: ICriteria<DTO.Ticket>;
}
export type TicketTableGetUnion =
    | TicketTableGetOptions
    | ((params: ParsedUrlQuery) => TicketTableGetOptions);

export interface TicketPageMetadata {
    data: DTO.Ticket[];
    total: number;
    products: Record<Mars.Product, number>;

    error?: any;
}
