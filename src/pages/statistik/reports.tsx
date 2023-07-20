import { AuditOutlined, DownloadOutlined } from '@ant-design/icons';
import {
    Col,
    Form,
    Input,
    Modal,
    Radio,
    Row,
    Space,
    Statistic,
    Table,
    Typography,
    message,
} from 'antd';
import axios from 'axios';
import { endOfDay, startOfToday } from 'date-fns';
import { NextPageContext } from 'next';
import { getSession } from 'next-auth/react';
import {
    createContext,
    MouseEvent,
    MouseEventHandler,
    ReactNode,
    useContext,
    useMemo,
} from 'react';
import dynamic from 'next/dynamic';
import { isBrowser } from '_utils/constants';
import { TFilter } from '_comp/table/table.filter';
import {
    MarsTableConsumer,
    MarsTablePagination,
    MarsTableProvider,
} from '_ctx/table.ctx';
import { BooleanInput, DateRangeFilter, EnumSelect } from '_comp/table/input.fields';
import { useRouter } from 'next/router';
import { usePage } from '_ctx/page.ctx';
import { PageTitle } from '_utils/conversion';
import { useBool } from '_hook/util.hook';
import notif from '_service/notif';
import { TableTicketColms } from '_comp/table';
import { usePageable } from '_hook/pageable.hook';

const Pie = dynamic(
    async () => {
        const mod = await import('@ant-design/plots');
        return mod.Pie;
    },
    { ssr: false }
);

const ReportContext = createContext<ReportContext>(null);
interface ReportContext {
    cardSpan: number;
}

function ReportsPage(props: ReportsPageProps) {
    const hGutter = 10;

    if (props.error) {
        return <>Fail to fetch data</>;
    }

    const data = props.data;
    const router = useRouter();
    const page = usePage();
    const switchView = useBool();
    const [filter] = Form.useForm<ICriteria<DTO.Ticket>>();
    const { pageable, setPageable } = usePageable();

    const refresh = () => {
        page.setLoading(true);
        return router
            .push({
                pathname: router.pathname,
                query: api.serializeParam({
                    ...filter.getFieldsValue(),
                }),
            })
            .finally(() => page.setLoading(false));
    };

    const downloadCsv = () => {
        if (data.chart.count.total === 0) {
            message.info('Total tiket pada report berjumlah 0');
        } else {
            page.setLoading(true);
            api.get('/chart/ticket/report/download', {
                responseType: 'blob',
                params: filter.getFieldsValue(),
            })
                .then((res) => {

                    const blob: Blob = res.data;
                    const href = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = href;
                    link.setAttribute('download', res.headers.filename);
                    link.click();

                    URL.revokeObjectURL(href);
                })
                .catch((err) => notif.error(err))
                .finally(() => page.setLoading(false));
        }
    };

    const initialDate = useMemo(
        () => ({
            gte: startOfToday(),
            lte: endOfDay(startOfToday()),
        }),
        []
    );

    const charts = (
        <Row className="mars-chart-container" gutter={16}>
            <ChartView title="Umur Tiket" data={data.chart.age} />
            <ChartView title="Lama Aksi" data={data.chart.actionAge} />
            <ChartView title="Waktu Respon" data={data.chart.responseAge} />
        </Row>
    );

    const tables = (
        <Table
            dataSource={data.raw}
            size="small"
            style={{ marginTop: 10 }}
            columns={TableTicketColms({ pageable })}
            pagination={MarsTablePagination({
                pageable,
                setPageable,
                total: props.data.rawTotal,
            })}
        />
    );

    return (
        <MarsTableProvider refresh={refresh}>
            <ReportContext.Provider value={{ cardSpan: 3 }}>
                <div className="mars-report">
                    <div className="mars-report-tools">
                        <MarsTableConsumer>
                            {(value) => (
                                <Radio.Group>
                                    <Radio.Button onClick={downloadCsv}>
                                        <Space>
                                            <DownloadOutlined />
                                            CSV
                                        </Space>
                                    </Radio.Button>
                                    <Radio.Button onClick={() => value.toggleFilter()}>
                                        Filter
                                    </Radio.Button>
                                </Radio.Group>
                            )}
                        </MarsTableConsumer>
                    </div>

                    <Row gutter={[hGutter, hGutter]}>
                        <CardInfo
                            title="Total Tiket"
                            value={data.chart.count.total}
                            prefix={<AuditOutlined />}
                            onClick={(event) => {
                                // router.push({
                                //     pathname:
                                //         router.pathname +
                                //         '/closed?' +
                                //         api.serializeParam(filter.getFieldsValue()),
                                // });
                                switchView.toggle();
                            }}
                        />
                        <CardInfo title="IPTV" value={data.chart.count.iptv} />
                        <CardInfo title="INTERNET" value={data.chart.count.internet} />
                        <CardInfo title="VOICE" value={data.chart.count.voice} />
                    </Row>
                    {!switchView.value && charts}
                    {switchView.value && tables}
                </div>
                <TFilter
                    form={filter}
                    title="Report"
                    initialValue={{
                        createdAt: initialDate,
                    }}
                >
                    <Form.Item label="Tanggal Dibuat" name="createdAt" required>
                        <DateRangeFilter withTime />
                    </Form.Item>
                    <Form.Item label="Sedang Dikerjakan" name={['wip', 'eq']}>
                        <BooleanInput />
                    </Form.Item>
                    <Form.Item label="Produk" name={['product', 'in']}>
                        <EnumSelect enums={Mars.Product} />
                    </Form.Item>
                    <Form.Item label="STO" name={['sto', 'like']}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Witel" name={['witel', 'in']}>
                        <EnumSelect enums={Mars.Witel} />
                    </Form.Item>
                    <Form.Item label="Tiket NOSSA" name={['incidentNo', 'like']}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Service No" name={['serviceNo', 'like']}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Status" name={['status', 'in']}>
                        <EnumSelect enums={Mars.Status} />
                    </Form.Item>
                    <Form.Item label="Sumber" name={['source', 'in']}>
                        <EnumSelect enums={Mars.Source} />
                    </Form.Item>
                    <Form.Item label="Gaul" name={['gaul', 'eq']}>
                        <BooleanInput />
                    </Form.Item>
                </TFilter>
            </ReportContext.Provider>
        </MarsTableProvider>
    );
}

function CardInfo(props: CardInfoProps) {
    const { cardSpan } = useContext(ReportContext) || {};
    return (
        <Col span={cardSpan} onClickCapture={props.onClick}>
            <Statistic
                className="mars-stat-card"
                title={props.title}
                value={props.value}
                prefix={props.prefix}
            />
        </Col>
    );
}
function ChartView(props: { data: PieChartData[]; title?: string; span?: number }) {
    const data = props.data;
    return (
        <Col className="mars-chart-view" span={props.span ?? 7}>
            <Typography.Title level={5}>
                <span>{props.title}</span>
            </Typography.Title>

            {isBrowser && (
                <Pie
                    className="mars-chart"
                    angleField="value"
                    colorField="type"
                    data={data}
                    radius={0.9}
                    label={{
                        type: 'inner',
                        offset: '-30%',
                        // content: ({ percent }) => `${(percent * 100).toFixed(0)}%`,
                        // content: ({ percent }) => `${percent}`,
                        style: {
                            fontSize: 14,
                            textAlign: 'center',
                        },
                    }}
                    interactions={[
                        { type: 'pie-legend-active' },
                        { type: 'element-active' },
                    ]}
                />
            )}
        </Col>
    );
}

export default PageTitle('Chart Report', ReportsPage);

export async function getServerSideProps(
    ctx: NextPageContext
): NextServerSidePropsAsync<ReportsPageProps> {
    const session = await getSession(ctx);

    const startDay = startOfToday();
    const endDay = endOfDay(startDay);

    const config = api.auhtHeader(session, {
        params: {
            'createdAt.gte': startDay,
            'createdAt.lte': endDay,
            ...ctx.query,
        },
    });
    const res = await api.manage(api.get('/chart/ticket/report', config));

    if (axios.isAxiosError(res)) {
        return {
            props: { data: res.response?.data, error: true },
        };
    }

    return {
        props: {
            error: false,
            data: {
                chart: res.data.chart,
                raw: res.data.raw,
                rawTotal: Number(res.headers['x-total-count'] || 0),
            },
        },
    };
}

interface ReportsPageProps {
    data: {
        chart: PieChartDTO;
        raw: DTO.Ticket[];
        rawTotal: number;
    };
    error: boolean;
}

interface CardInfoProps extends HasChild {
    title?: string;
    value: number;
    prefix?: ReactNode;
    onClick?: MouseEventHandler<HTMLElement>;
}

interface PieChartData {
    type: string;
    value: number;
    color?: string;
}

interface PieChartDTO {
    age: PieChartData[];
    actionAge: PieChartData[];
    responseAge: PieChartData[];
    count: {
        total: number;
        iptv: number;
        internet: number;
        voice: number;
    };
}
