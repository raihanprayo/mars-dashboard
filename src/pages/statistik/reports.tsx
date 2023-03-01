import { AuditOutlined } from '@ant-design/icons';
import { Col, Form, Input, Modal, Radio, Row, Statistic, Typography } from 'antd';
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
import { MarsTableConsumer, MarsTableProvider } from '_ctx/table.ctx';
import { BooleanInput, DateRangeFilter, EnumSelect } from '_comp/table/input.fields';
import { useRouter } from 'next/router';
import { usePage } from '_ctx/page.ctx';
import { PageTitle } from '_utils/conversion';

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
    const [filter] = Form.useForm<ICriteria<DTO.Ticket>>();

    const refresh = () => {
        page.setLoading(true);
        return router
            .push({
                pathname: router.pathname,
                query: api.serializeParam({
                    ...filter.getFieldsValue(),
                    roles: {},
                }),
            })
            .finally(() => page.setLoading(false));
    };

    const initialDate = useMemo(
        () => ({
            gte: startOfToday(),
            lte: endOfDay(startOfToday()),
        }),
        []
    );

    return (
        <MarsTableProvider refresh={refresh}>
            <ReportContext.Provider value={{ cardSpan: 3 }}>
                <div className="mars-report">
                    <div className="mars-report-tools">
                        <MarsTableConsumer>
                            {(value) => (
                                <Radio.Group>
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
                            value={data.count.total}
                            prefix={<AuditOutlined />}
                            onClick={(event) =>
                                router.push({
                                    pathname: router.pathname + '/closed',
                                    query: router.query,
                                })
                            }
                        />
                        <CardInfo title="IPTV" value={data.count.iptv} />
                        <CardInfo title="INTERNET" value={data.count.internet} />
                        <CardInfo title="VOICE" value={data.count.voice} />
                    </Row>
                    <Row className="mars-chart-container" gutter={16}>
                        <ChartView title="Umur Tiket" data={data.age} />
                        <ChartView title="Lama Aksi" data={data.actionAge} />
                        <ChartView title="Waktu Respon" data={data.responseAge} />
                    </Row>
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

export async function getServerSideProps(ctx: NextPageContext) {
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
    const res = await api.get('/chart/ticket/report', config).catch((err) => err);

    if (axios.isAxiosError(res)) {
        return {
            props: { data: res.response?.data, error: true },
        };
    }

    return {
        props: { data: res.data, error: false },
    };
}

interface ReportsPageProps {
    data: PieChartDTO;
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
