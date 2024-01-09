import { ReloadOutlined } from "@ant-design/icons";
import { Button, Form, Space, Table } from "antd";
import { useCallback, useState } from "react";
import { THeader } from "_comp/table/table.header";
import { NextPageContext } from "next";
import { getSession } from "next-auth/react";
import { CoreService } from "_service/api";
import axios from "axios";
import { useRouter } from "next/router";
import { usePage } from "_ctx/page.ctx";
import { DateRangeFilter } from "_comp/table/input.fields";
import { DefaultCol } from "_comp/table/table.definitions";
import { PageTitle } from "_utils/conversion";
import { Mars } from "@mars/common/types/mars";
import { isArr, isDefined } from "@mars/common";
import { Pageable } from "@mars/common/types/enums";
import { usePageable } from "_hook/pageable.hook";

export async function getServerSideProps(ctx: NextPageContext) {
    const session = await getSession(ctx);

    const { page, size, ...query } = ctx.query;
    const config = api.auhtHeader(session, {
        params: query,
    });

    const res = await api.manage(api.get("/chart/leaderboard", config));
    if (axios.isAxiosError(res)) return api.serverSideError(res);
    else {
        let data: LeaderboardDTO[] = res.data;
        // if (sort.length > 0) {
        //     const field = sort[0];
        //     const direction = sort[1];

        //     data = data.sort((a, b) => {
        //         if (field !== "score") {
        //             const a1 = a[sort[0]];
        //             const b1 = b[sort[0]];
        //             return direction === Pageable.Sorts.ASC ? a1 - b1 : b1 - a1;
        //         } else {
        //             const a1 =
        //                 a.total - a.totalDispatch * 0.1 + a.totalHandleDispatch * 0.1;
        //             const b1 =
        //                 b.total - b.totalDispatch * 0.1 + b.totalHandleDispatch * 0.1;
        //             return direction === Pageable.Sorts.ASC ? a1 - b1 : b1 - a1;
        //         }
        //     });
        // }

        return { props: { data } };
    }
}

function LeaderboardPage(props: LeaderboardPageProps) {
    const router = useRouter();
    const page = usePage();

    // const { pageable } = usePageable();
    const [filter] = Form.useForm<LeaderboardCriteria>();
    const { pageable, updateSort } = usePageable();
    // const [sort, setSort] = useState<PageableSortTupple>();

    const refresh = useCallback(() => {
        page.setLoading(true, "Complicated query, please wait");
        return router
            .push({
                pathname: router.pathname,
                query: api.serializeParam(filter.getFieldsValue()),
            })
            .finally(() => page.setLoading(false));
    }, []);

    return (
        <div className="workspace table-view">
            <Form form={filter}>
                <THeader>
                    <THeader.Item pos="right">
                        <Space align="baseline">
                            <Form.Item name="createdAt" noStyle>
                                <DateRangeFilter withTime />
                            </Form.Item>
                            <Button
                                type="primary"
                                icon={<ReloadOutlined />}
                                onClick={refresh}
                            />
                        </Space>
                    </THeader.Item>
                </THeader>
            </Form>
            <Table<LeaderboardDTO>
                size="small"
                dataSource={
                    props.data
                    //     .sort((a, b) => {
                    //     console.log("Apply Sort Leaderboard");
                    //     if (!isDefined(sort)) {
                    //         return 0;
                    //     }

                    //     const [field, direction] = sort;
                    //     if (field !== "Skor") {
                    //         const a1 = a[sort[0]];
                    //         const b1 = b[sort[0]];
                    //         return direction === Pageable.Sorts.ASC ? a1 - b1 : b1 - a1;
                    //     } else {
                    //         const a1 =
                    //             a.total - a.totalDispatch * 0.1 + a.totalHandleDispatch * 0.1;
                    //         const b1 =
                    //             b.total - b.totalDispatch * 0.1 + b.totalHandleDispatch * 0.1;
                    //         return direction === Pageable.Sorts.ASC ? a1 - b1 : b1 - a1;
                    //     }
                    // })
                }
                pagination={false}
                onChange={(paginate, filters, sorter, extra) => {
                    if (extra.action === "sort") {
                        console.log("Manual Sort Leaderboard", sorter);
                        if (!isArr(sorter)) {
                            console.log("Single Sort");
                            const { column, order, field, columnKey } = sorter;
                            const f = !isArr(field) ? String(field) : field.join(".");
                            updateSort(f, order);
                        } else {
                            for (const sortProp of sorter) {
                                const { column, order, field } = sortProp;
                                const f = !isArr(field) ? String(field) : field.join(".");
                                updateSort(f, order);
                            }
                        }
                    }
                }}
                columns={[
                    DefaultCol.NO_COL,
                    {
                        title: "NIK",
                        align: "center",
                        dataIndex: "nik",
                        sorter: true,
                    },
                    {
                        title: "Nama",
                        align: "center",
                        dataIndex: "name",
                        sorter: {
                            multiple: 1,
                        },
                    },
                    {
                        title: "Avg Action",
                        align: "center",
                        dataIndex: "avgAction",
                        render: (v: number) => {
                            return calcTime(v);
                        },
                        sorter: true,
                    },
                    {
                        title: "Total Dispatch",
                        align: "center",
                        dataIndex: "totalDispatch",
                        sorter: true,
                    },
                    {
                        title: "Handle Dispatch",
                        align: "center",
                        dataIndex: "totalHandleDispatch",
                        sorter: true,
                    },
                    {
                        title: "Skor",
                        align: "center",
                        dataIndex: "score",
                        sorter: true,
                        render(v, record) {
                            const score =
                                record.total -
                                record.totalDispatch * 0.1 +
                                record.totalHandleDispatch * 0.1;
                            return score === 0 ? 0 : score.toFixed(2);
                        },
                    },
                    {
                        title: "Total",
                        align: "center",
                        dataIndex: "total",
                        sorter: true,
                    },
                ]}
            />
        </div>
    );
}

interface LeaderboardPageProps extends CoreService.ErrorDTO {
    data: LeaderboardDTO[];
    total: number;
}

export default PageTitle("Leaderboard", LeaderboardPage);

interface LeaderboardCriteria {
    product: IFilter.Readable<Mars.Product>;
    createdAt: IFilter.Range<Date>;
    updatedAt: IFilter.Range<Date>;
}
interface LeaderboardDTO {
    id: string;
    nik: string;
    name: string;

    avgRespon: number;
    avgAction: number;

    totalDispatch: number;
    totalHandleDispatch: number;
    total: number;

    worklogs: DTO.AgentWorklog[];
}

function calcTime(time: number, unit: "ms" | "s" | "m" = "m") {
    if (unit === "ms") return time + " Mili";

    const second = time / 1000;
    if (unit === "s") return Math.round(second) + " Detik";

    const minute = second / 60;
    return Math.round(minute) + " Menit";
}
