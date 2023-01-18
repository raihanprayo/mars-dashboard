import Icon, {
    AuditOutlined,
    CheckCircleOutlined,
    CheckOutlined,
    InboxOutlined,
    InfoCircleOutlined,
    LoginOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { isDefined } from '@mars/common';
import {
    Button,
    Descriptions,
    Divider,
    Form,
    Image,
    Input,
    List,
    Radio,
    Space,
    Tabs,
    Tag,
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
import { useContext, useEffect, useMemo, useState } from 'react';
import type { RcFile, UploadFile } from 'antd/lib/upload';
import { RefreshBadgeEvent } from '_utils/events';
import { useRouter } from 'next/router';
import { PageContext } from '_ctx/page.ctx';
import Link from 'next/link';
import { format } from 'date-fns';
import { MarsButton } from '_comp/base';

const AcceptableFileExt = ['.jpg', '.jpeg', '.png', '.webp'];

function TicketDetail(props: TicketDetailProps) {
    const ticket: DTO.Ticket = props.data || ({} as any);
    const route = useRouter();
    const session = useSession();

    const pageCtx = useContext(PageContext);
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
            session.status === 'authenticated' &&
            ticket.wipBy?.nik !== session.data?.user?.nik;

        return invalidStat || invalidProgress;
    }, [ticket]);

    const onSubmit = async () => {
        try {
            await submission.validateFields();
        } catch (err) {
            return;
        }

        const form = new FormData();
        form.set('description', description);
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
            .catch((err) => {});
    };

    useEffect(() => {
        if (disableSubmit) return;

        const leaveMessage = `You have unsaved changes, are you sure you want to leave this page?`;

        const handleWindowClose = (e: BeforeUnloadEvent) => {
            if (!unsaved || resolved) return;
            e.preventDefault();
            return (e.returnValue = leaveMessage);
        };
        const handleBrowseAway = () => {
            if (!unsaved || resolved) return;
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

    if (props.error) {
        return <>Cannot get Ticket detail</>;
    }

    const logs = [...props.logs].reverse();
    const agents = props.agents.filter((agent) => {});

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
                                <b>by:</b> {log.createdBy}
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
            label: 'Agents',
            disabled: props.agents.length === 0,
        },
    ];

    return (
        <div className="tc-detail-container">
            <div className="tc-detail-content">
                <Descriptions
                    bordered
                    size="small"
                    title={
                        <Typography.Title level={3}>
                            <AuditOutlined className="tc-desc-title-icon" />
                            <span className="tc-desc-title">Tiket - {ticket.no}</span>
                        </Typography.Title>
                    }
                    layout="vertical"
                >
                    <Descriptions.Item label="No">{ticket.no}</Descriptions.Item>
                    <Descriptions.Item label="Gangguan Ulang" span={5}>
                        {Render.bool(ticket.gaul)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Service">
                        {ticket.serviceNo}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tiket Nossa">
                        {ticket.incidentNo}
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
                        <Tag className="tag-status">
                            <b>{ticket.sto}</b>
                        </Tag>
                    </Descriptions.Item>

                    <Descriptions.Item label="Note" span={5}>
                        {ticket.note ?? <i>*Empty*</i>}
                    </Descriptions.Item>
                    <Descriptions.Item label="Attachments" span={5}>
                        <SharedImage assets={ticket.assets} />
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
                    <Form form={submission} layout="vertical" disabled>
                        <Form.Item
                            name="status"
                            label={<b>Status</b>}
                            colon
                            rules={[
                                { required: true, message: 'Status update required' },
                            ]}
                        >
                            <Radio.Group
                                buttonStyle="solid"
                                // value={updateTo}
                                // onChange={(e) => setUpdateTo(e.target.value)}
                            >
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

                        <Form.Item label={<b>Description</b>} name="description">
                            <Input.TextArea
                                // value={description}
                                // onChange={(e) => setDescription(e.currentTarget.value)}
                                placeholder="work description"
                            />
                        </Form.Item>

                        <Form.Item label={<b>Attachments</b>}>
                            <Form.Item name="files" noStyle>
                                <Upload.Dragger
                                    multiple
                                    fileList={files}
                                    name="files"
                                    accept={AcceptableFileExt.join(', ')}
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
    );
}

export async function getServerSideProps(ctx: NextPageContext) {
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
        const res = await api.get(`/ticket/${ticketNo}`, config).catch((err) => err);

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
            const nextRes = ctx.res;
            nextRes.setHeader('Cache-Control', 'public, s-maxage');

            const data: DTO.Ticket = res.data;
            const logRes = await api.get(`/ticket/logs/${ticketNo}`, config);
            const agentRes = await api.get<DTO.TicketAgent[]>(
                `/ticket/agents/${ticketNo}`,
                config
            );
            const relatedRes = await api.get<DTO.Ticket[]>(
                `/ticket/${ticketNo}/relation`,
                config
            );

            return {
                props: {
                    data,
                    logs: logRes.data,
                    agents: agentRes.data,
                    relation: relatedRes.data.filter((e) => e.id !== data.id),
                },
            };
        }
    }
}

function SharedImage(props: SharedImageProps) {
    const { assets } = props;
    if (!assets) return <i>*Empty</i>;

    return (
        <Image.PreviewGroup>
            {assets.map((path) => {
                const src = '/api/shared' + path;
                return <Image key={path} alt={path} width={200} src={src} />;
            })}
        </Image.PreviewGroup>
    );
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
                            <Space title='Tiket Status'>
                                <InfoCircleOutlined />
                                {item.status}
                            </Space>,
                            <Space title='Tanggal Dibuat'>
                                <LoginOutlined />
                                {format(
                                    new Date(item.createdAt),
                                    Render.DATE_WITH_TIMESTAMP
                                )}
                            </Space>,
                            <Space title='Dibuat Oleh'>
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
export default TicketDetail;

interface TicketDetailProps {
    data: DTO.Ticket;
    logs: DTO.TicketLog[];
    agents: DTO.TicketAgent[];
    relation: DTO.Ticket[];
    error: any;
}

interface SharedImageProps {
    assets?: string[];
}
