import {
    AuditOutlined,
    CheckOutlined,
    CopyOutlined,
    DoubleRightOutlined,
    InboxOutlined,
    InfoCircleOutlined,
    LoginOutlined,
    RightSquareOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { HttpHeader, isDefined } from '@mars/common';
import {
    Descriptions,
    Divider,
    Form,
    Image,
    Input,
    List,
    message,
    Radio,
    Space,
    Tabs,
    Timeline,
    Typography,
    Upload,
} from 'antd';
import type { Tab } from 'rc-tabs/lib/interface';
import axios from 'axios';
import { NextPageContext } from 'next';
import { getSession, useSession } from 'next-auth/react';
import { Render } from '_comp/value-renderer';
import Card from 'antd/lib/card/Card';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import type { RcFile, UploadFile } from 'antd/lib/upload';
import { RefreshBadgeEvent } from '_utils/events';
import { PageContext, usePage } from '_ctx/page.ctx';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { format } from 'date-fns';
import { CopyToClipboard, MarsButton } from '_comp/base';
import notif from '_service/notif';
import { SolutionSelect } from '_comp/table/input.fields';
import Head from 'next/head';
import { CreatedBy } from '_comp/base/CreatedBy';
import { scanAssets, ScannedAsset, WorklogAsset } from '_utils/fns/scan-asset';
import { IMAGE_FILE_EXT } from '_utils/constants';

// const AcceptableFileExt = ['.jpg', '.jpeg', '.png', '.webp'];
const BlobCache = new Map<string, ImageHolder>();
const DetailContext = createContext<DetailContext>(null);

interface DetailContext {
    ticket: DTO.Ticket;
    assets: ScannedAsset;
}
interface ImageHolder {
    type: string;
    data: Blob;
}

function TicketDetail(props: TicketDetailProps) {
    const ticket: DTO.Ticket = props.data || ({} as any);
    const route = useRouter();
    const session = useSession();

    const pageCtx = usePage();
    const [submission] = Form.useForm();
    const [resolved, setResolved] = useState(false);
    const [files, setFiles] = useState<UploadFile[]>([]);

    const description = Form.useWatch('description', submission);
    const status = Form.useWatch('status', submission);
    const unsaved = useMemo(() => {
        if (description) return true;
        if (files.length) return true;
        return false;
    }, [files, description]);

    const disableSubmit = useMemo(() => {
        const invalidStat = [
            Mars.Status.CLOSED,
            Mars.Status.PENDING,
            Mars.Status.CONFIRMATION,
        ].includes(ticket.status);

        const invalidProgress =
            session.status === 'authenticated' && ticket.wipBy !== session.data?.user?.id;

        return invalidStat || invalidProgress;
    }, [ticket]);

    const onSubmit = async () => {
        try {
            await submission.validateFields();
        } catch (err) {
            return;
        }

        const form = new FormData();
        const solution = submission.getFieldValue('solution')?.value;

        form.set('note', description);
        if (solution) form.set('solution', solution);
        for (const file of files) form.append('files', file as RcFile, file.fileName);

        const statusLink =
            status === Mars.Status.CLOSED
                ? 'close'
                : status === Mars.Status.DISPATCH
                ? 'dispatch'
                : 'pending';

        const url = `/ticket/wip/${statusLink}/${ticket.id}`;

        pageCtx.setLoading(true);
        api.postForm(url, form)
            .then(() => RefreshBadgeEvent.emit())
            .then(() => setResolved(true))
            .then(() => (window.location.href = '/inbox'))
            .catch((err) => notif.error(err))
            .finally(() => pageCtx.setLoading(false));
    };

    const onPaste = async (event: ClipboardEvent | React.ClipboardEvent) => {
        const data = event.clipboardData;

        console.log('Clipboard:', data);
        console.log('Submit Disabled:', disableSubmit);
        if (data && !disableSubmit) {
            const files: File[] = [];
            for (const file of data.files) {
                const isImage = file.type.toLowerCase().startsWith('image/');
                if (isImage) files.push(file);
            }

            if (files.length > 0) {
                setFiles((p) => [...p, ...(files as any)]);
            }
        }
    };

    useEffect(() => {
        if (disableSubmit) return;

        const leaveMessage = `You have unsaved changes, are you sure you want to leave this page?`;

        const handleWindowClose = (e: BeforeUnloadEvent) => {
            if (resolved || !unsaved) return;
            e.preventDefault();
            return (e.returnValue = leaveMessage);
        };
        const handleBrowseAway = () => {
            if (resolved || !unsaved) return;
            if (window.confirm(leaveMessage)) return;
            route.events.emit('routeChangeError');
            throw 'routeChange aborted';
        };

        addEventListener('beforeunload', handleWindowClose);
        route.events.on('routeChangeStart', handleBrowseAway);
        return () => {
            removeEventListener('beforeunload', handleWindowClose);
            route.events.off('routeChangeStart', handleBrowseAway);
        };
    }, [description, files]);

    useEffect(() => {
        document.addEventListener('paste', onPaste);
        return () => document.removeEventListener('paste', onPaste);
    }, []);

    if (props.error) {
        return <>Cannot get Ticket detail</>;
    }

    const logs = [...props.logs].reverse();

    const tabItems: Tab[] = [
        {
            key: 'dt-timeline',
            label: 'Timeline',
            children: (
                <Timeline mode="left">
                    {logs.map((log, i) => {
                        const d = Render.date(log.createdAt, Render.DATE_WITH_TIMESTAMP);
                        return (
                            <Timeline.Item key={`tl:item-${i}`} label={d}>
                                {log.message}
                                <br />
                                <b>by:</b> <CreatedBy data={log} />
                            </Timeline.Item>
                        );
                    })}
                </Timeline>
            ),
        },
        {
            key: 'dt-gaul',
            label: 'Gaul Relation',
            disabled: !ticket.gaul,
            children: <GaulRelation relations={props.relation} />,
        },
        {
            key: 'dt-agent',
            label: 'Workspaces',
            disabled: props.workspaces.length < 1,
            children: (
                <>
                    {(props.workspaces || [])
                        .sort((a, b) => a.id - b.id)
                        .reverse()
                        .map((ws) => (
                            <Workspaces key={'workspace-' + ws.id} ws={ws} />
                        ))}
                </>
            ),
        },
    ];

    const watchStat = Form.useWatch('status', submission);
    return (
        <DetailContext.Provider value={{ ticket: props.data, assets: props.assets }}>
            <div className="tc-detail-container">
                <Head>
                    <title>Mars - Detail Tiket {ticket.no}</title>
                </Head>
                <div className="tc-detail-content">
                    <Descriptions
                        bordered
                        size="small"
                        title={
                            <Typography.Title level={3}>
                                <AuditOutlined className="tc-desc-title-icon" />
                                <span className="tc-desc-title">
                                    Tiket - <CopyToClipboard data={ticket.no} />
                                </span>
                            </Typography.Title>
                        }
                        layout="vertical"
                    >
                        <Descriptions.Item label="No">
                            <CopyToClipboard data={ticket.no} />
                        </Descriptions.Item>
                        <Descriptions.Item label="Gangguan Ulang" span={5}>
                            {Render.bool(ticket.gaul)}
                        </Descriptions.Item>

                        <Descriptions.Item label="Service">
                            <CopyToClipboard data={ticket.serviceNo} withIcon />
                        </Descriptions.Item>
                        <Descriptions.Item label="Tiket Nossa">
                            <CopyToClipboard data={ticket.incidentNo} withIcon />
                        </Descriptions.Item>
                        <Descriptions.Item label="Kendala">
                            {ticket.issue.name}
                        </Descriptions.Item>

                        <Descriptions.Item label="Product">
                            {Render.product(ticket.product)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Witel">
                            {Render.witel(ticket.witel)}
                        </Descriptions.Item>
                        <Descriptions.Item label="STO" span={2}>
                            {Render.tags({ bold: true, statusDisplay: true })(ticket.sto)}
                        </Descriptions.Item>

                        <Descriptions.Item label="Sumber">
                            {Render.tags({ bold: true, statusDisplay: true })(
                                ticket.source
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Note" span={3}>
                            {ticket.note ?? <i>*Empty*</i>}
                        </Descriptions.Item>

                        <Descriptions.Item label="Attachments" span={5}>
                            <SharedImage assets={props.assets.assets} emptyWithText />
                        </Descriptions.Item>
                    </Descriptions>
                    <Divider />
                    <Tabs type="line" items={tabItems} />
                </div>
                <div className="tc-detail-info">
                    <Card
                        title="Update Submission"
                        size="small"
                        actions={[
                            <MarsButton
                                type="primary"
                                key="submit-btn"
                                title="Submit work log"
                                icon={<CheckOutlined />}
                                onClick={onSubmit}
                                disabledOnRole={MarsButton.disableIfAdmin}
                                disabled={disableSubmit}
                            >
                                Submit
                            </MarsButton>,
                        ]}
                    >
                        <Form
                            form={submission}
                            layout="vertical"
                            initialValues={{
                                status: Mars.Status.CLOSED,
                                solution: null,
                                description: null,
                                files: null,
                            }}
                        >
                            <Form.Item
                                name="status"
                                label={<b>Status</b>}
                                colon
                                rules={[
                                    { required: true, message: 'Status update required' },
                                ]}
                            >
                                <Radio.Group buttonStyle="solid" disabled={disableSubmit}>
                                    <Radio.Button value={Mars.Status.CLOSED}>
                                        Close
                                    </Radio.Button>
                                    <Radio.Button value={Mars.Status.DISPATCH}>
                                        Dispatch
                                    </Radio.Button>
                                    <Radio.Button value={Mars.Status.PENDING}>
                                        Pending
                                    </Radio.Button>
                                </Radio.Group>
                            </Form.Item>

                            <Form.Item label={<b>Actual Solution</b>} name="solution">
                                <SolutionSelect disabled={disableSubmit} />
                            </Form.Item>

                            <Form.Item
                                label={<b>Worklog</b>}
                                name="description"
                                rules={[
                                    {
                                        required: watchStat !== Mars.Status.DISPATCH,
                                        message: 'Worklog tidak boleh kosong',
                                    },
                                ]}
                            >
                                <Input.TextArea
                                    placeholder="work description"
                                    disabled={disableSubmit}
                                />
                            </Form.Item>

                            <Form.Item label={<b>Attachments</b>}>
                                <Form.Item name="files" noStyle>
                                    <Upload.Dragger
                                        disabled={disableSubmit}
                                        multiple
                                        fileList={files}
                                        name="files"
                                        accept={IMAGE_FILE_EXT.join(', ')}
                                        onRemove={(file) => {
                                            const index = files.indexOf(file);
                                            const copy = [...files];
                                            copy.splice(index, 1);
                                            setFiles(copy);
                                        }}
                                        beforeUpload={(file) => {
                                            setFiles((prev) => [...prev, file]);
                                            return false;
                                        }}
                                    >
                                        <p className="ant-upload-drag-icon">
                                            <InboxOutlined />
                                        </p>
                                        {/* <p className="ant-upload-text">
                                        Click or drag file to this area to upload
                                    </p> */}
                                        <p className="ant-upload-hint">
                                            Click or drag file to this area to upload
                                            {/* Support for a single or bulk upload. */}
                                        </p>
                                    </Upload.Dragger>
                                </Form.Item>
                            </Form.Item>
                        </Form>
                    </Card>
                </div>
            </div>
        </DetailContext.Provider>
    );
}

export async function getServerSideProps(
    ctx: NextPageContext
): NextServerSidePropsAsync<TicketDetailProps> {
    const ticketNo = ctx.query.no;
    const session = await getSession(ctx);

    if (!isDefined(session)) {
        return {
            props: {
                error: {
                    status: 401,
                    title: 'Unauthorized',
                    detail: 'Full authentication required to access this resource',
                },
            },
        };
    } else {
        const config = api.auhtHeader(session);
        const res = await api
            .get(`/ticket/detail/${ticketNo}`, config)
            .catch((err) => err);

        if (axios.isAxiosError(res)) {
            const errorData = res.response?.data ?? {
                status: res.status,
                title: 'Internal Error',
                detail: res.message,
            };
            return {
                props: {
                    error: errorData,
                },
            };
        } else {
            const data: DTO.Ticket = res.data;
            const logRes = await api.get(`/ticket/detail/${ticketNo}/logs`, config);
            const relatedRes = await api.get<DTO.Ticket[]>(
                `/ticket/detail/${ticketNo}/relation`,
                { ...config, params: { wip: { in: [true, false] } } }
            );
            const workspacesRes = await api.get<DTO.AgentWorkspace[]>(
                `/ticket/detail/${ticketNo}/workspaces`,
                { ...config, params: { full: true } }
            );

            const result: NextServerSideProps<TicketDetailProps> = {
                props: {
                    data,
                    logs: logRes.data,
                    workspaces: workspacesRes.data,
                    relation: relatedRes.data.filter((e) => e.id !== data.id),
                    assets: scanAssets(data, workspacesRes.data),
                },
            };

            return result;
        }
    }
}

export default TicketDetail;

interface TicketDetailProps {
    data: DTO.Ticket;
    logs: DTO.TicketLog[];
    workspaces: DTO.AgentWorkspace[];
    relation: DTO.Ticket[];
    assets: ScannedAsset;
    error: any;
}

function SharedImage(props: SharedImageProps) {
    const { assets = [] } = props;
    if (!isDefined(assets) || assets.length === 0) {
        if (!props.emptyWithText) return <></>;
        return <i className="text-primary">* No Image</i>;
    }

    const copyImage = useCallback(async (path: string) => {
        try {
            let img = BlobCache.get(path);
            if (!img) {
                const res = await fetch(path);

                img.type = res.headers.get(HttpHeader.CONTENT_TYPE);
                img.data = await res.blob();
                BlobCache.set(path, img);
            }

            await navigator.clipboard.write([
                new ClipboardItem({ [img.type]: img.data }),
            ]);
            message.success('Image copied to clipboard');
        } catch (ex) {
            notif.error(ex);
        }
    }, []);

    return (
        <Image.PreviewGroup>
            {assets.map((path) => {
                const src = '/api/shared' + (path.startsWith('/') ? '' : '/') + path;
                return (
                    <Image
                        key={path}
                        alt={path}
                        // width={200}
                        height={85}
                        src={src}
                        preview={{
                            title: (
                                <Space>
                                    <CopyOutlined
                                        size={30}
                                        onClick={() => copyImage(src)}
                                    />
                                </Space>
                            )
                        }}
                    />
                );
            })}
        </Image.PreviewGroup>
    );
}
interface SharedImageProps {
    assets?: string[];
    emptyWithText?: boolean;
}
function GaulRelation(props: { relations: DTO.Ticket[] }) {
    const { relations = [] } = props;

    return (
        <List
            className="tc-detail-relations"
            itemLayout="vertical"
            dataSource={relations}
            renderItem={(item) => {
                const title = <Link href={`/ticket/${item.no}`}>Tiket - {item.no}</Link>;

                const description = (
                    <p className="text-primary">
                        Created:{' '}
                        {format(new Date(item.createdAt), Render.DATE_WITH_TIMESTAMP)},
                        By: {item.createdBy}
                    </p>
                );
                const actionStatus = (
                    <span
                        key={`action-stat:${item.no}`}
                        title={`Tiket status: ${item.status}`}
                    >
                        {Render.orderStatus(item.status)}
                    </span>
                );
                return (
                    <List.Item
                        className="tc-detail-relations-item"
                        actions={[
                            <Space title="Tiket Status">
                                <InfoCircleOutlined />
                                {item.status}
                            </Space>,
                            <Space title="Tanggal Dibuat">
                                <LoginOutlined />
                                {format(
                                    new Date(item.createdAt),
                                    Render.DATE_WITH_TIMESTAMP
                                )}
                            </Space>,
                            <Space title="Dibuat Oleh">
                                <UserOutlined />
                                {item.createdBy}
                            </Space>,
                        ]}
                    >
                        <List.Item.Meta title={title} description={item.note} />
                        {/* <div className="tc-detail-relations-content">{item.note}</div> */}
                    </List.Item>
                );
            }}
        />
    );
}

function Workspaces(props: { ws: DTO.AgentWorkspace }) {
    const { ws } = props;
    const title = (
        <Space>
            <span className="text-primary">{ws.status}</span> |
            <CreatedBy data={{ nik: ws.agent.nik }} field="nik" replace />
        </Space>
    );
    const extra = <Space>{Render.date(ws.createdAt, Render.DATE_WITH_TIMESTAMP)}</Space>;
    return (
        <Card title={title} size="small" extra={extra} style={{ marginBottom: '1rem' }}>
            {ws.worklogs
                .sort((a, b) => a.id - b.id)
                .reverse()
                .map((wl) => (
                    <WorklogView key={`worklog:${ws.id}-` + wl.id} ws={ws} wl={wl} />
                ))}
        </Card>
    );
}
function WorklogView(props: { ws: DTO.AgentWorkspace; wl: DTO.AgentWorklog }) {
    const { ws, wl } = props;

    const detailCtx = useContext(DetailContext);
    const assets = useMemo<WorklogAsset>(
        () => detailCtx.assets.worklogs[wl.id] || ({} as any),
        [wl.id]
    );

    const title = (
        <Space>
            {wl.takeStatus}
            <RightSquareOutlined />
            {wl.closeStatus || <span className="text-primary">* Sedang Dikerjakan</span>}
        </Space>
    );

    const extra = <Space>{Render.date(wl.createdAt, Render.DATE_WITH_TIMESTAMP)}</Space>;
    const messageFooter = (
        <>
            <Divider style={{ margin: '10px 0' }} />
            <p>{wl.reopenMessage || '-'}</p>
            <SharedImage assets={assets?.requestor} />
        </>
    );
    return (
        <Card type="inner" size="small" title={title} extra={extra}>
            {wl.message && <p>{wl.message || '-'}</p>}
            {assets.assets && <SharedImage assets={assets.assets} />}

            {isDefined(wl.reopenMessage) && messageFooter}
        </Card>
    );
}
