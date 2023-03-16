import { ReloadOutlined } from '@ant-design/icons';
import { Button, Form, Space, Table } from 'antd';
import { useCallback } from 'react';
import { THeader } from '_comp/table/table.header';
import { NextPageContext } from 'next';
import { getSession } from 'next-auth/react';
import { CoreService } from '_service/api';
import axios from 'axios';
import { HttpHeader } from '@mars/common';
import { useRouter } from 'next/router';
import { usePage } from '_ctx/page.ctx';
import { usePageable } from '_hook/pageable.hook';
import { DateRangeFilter } from '_comp/table/input.fields';
import { DefaultCol } from '_comp/table/table.definitions';
import { PageTitle } from '_utils/conversion';

function LeaderboardPage(props: LeaderboardPageProps) {
    const router = useRouter();
    const page = usePage();

    const { pageable } = usePageable();
    const [filter] = Form.useForm<LeaderboardCriteria>();

    const refresh = useCallback(() => {
        page.setLoading(true, 'Complicated query, please wait');
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
                    ...filter.getFieldsValue(),
                }),
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
            <Table
                size="small"
                dataSource={props.data}
                columns={[
                    DefaultCol.INCREMENTAL_NO_COL(pageable),
                    {
                        title: 'NIK',
                        align: 'center',
                        dataIndex: 'nik',
                    },
                    {
                        title: 'Nama',
                        align: 'center',
                        dataIndex: 'name',
                    },
                    {
                        title: 'Avg Response',
                        align: 'center',
                        dataIndex: 'avgRespon',
                        render: (v: number) => {
                            return calcTime(v);
                        },
                    },
                    {
                        title: 'Avg Action',
                        align: 'center',
                        dataIndex: 'avgAction',
                        render: (v: number) => {
                            return calcTime(v);
                        },
                    },
                    {
                        title: 'Total Dispatch',
                        align: 'center',
                        dataIndex: 'totalDispatch',
                    },
                    {
                        title: 'Handle Dispatch',
                        align: 'center',
                        dataIndex: 'totalHandleDispatch',
                    },
                    {
                        title: 'Total',
                        align: 'center',
                        dataIndex: 'total',
                    },
                ]}
            />
        </div>
    );
}
export async function getServerSideProps(ctx: NextPageContext) {
    const session = await getSession(ctx);
    const config = api.auhtHeader(session, {
        params: ctx.query,
    });

    const res = await api.manage(api.get('/chart/leaderboard', config));
    if (axios.isAxiosError(res)) return api.serverSideError(res);
    else {
        const total = res.headers[HttpHeader.X_TOTAL_COUNT] || res.data.length;
        return {
            props: {
                total,
                data: res.data,
            },
        };
    }
}

interface LeaderboardPageProps extends CoreService.ErrorDTO {
    data: LeaderboardDTO[];
    total: number;
}

export default PageTitle('Leaderboard', LeaderboardPage);

interface LeaderboardCriteria {
    range: IFilter.Range<Date>;
    product: IFilter.Readable<Mars.Product>;
}
interface LeaderboardDTO {
    id: string;
    nik: string;
    name: string;

    avgResponTime: number;
    avgActionTime: number;

    totalDispatch: number;
    totalHandleDispatch: number;
    total: number;
}

function calcTime(time: number, unit: 'ms' | 's' | 'm' = 'm') {
    if (unit === 'ms') return time + ' Mili';

    const second = time / 1000;
    if (unit === 's') return Math.round(second) + ' Detik';

    const minute = second / 60;
    return Math.round(minute) + ' Menit';
}
