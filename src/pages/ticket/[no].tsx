import Icon, {
    AuditOutlined,
    CheckCircleOutlined,
    CheckOutlined,
    InboxOutlined,
} from '@ant-design/icons';
import { isDefined } from '@mars/common';
import {
    Button,
    Descriptions,
    Divider,
    Form,
    Input,
    Radio,
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
import { useEffect, useMemo, useState } from 'react';
import type { RcFile, UploadFile } from 'antd/lib/upload';
import { RefreshBadgeEvent } from '_utils/events';
import { useRouter } from 'next/router';

const AcceptableFileExt = ['.jpg', '.jpeg', '.png', '.webp'];

function TicketDetail(props: TicketDetailProps) {
    const ticket = props.data;
    const route = useRouter();
    const session = useSession();
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

    const onSubmit = async () => {
        // console.log(files);
        // console.log('Description:', description);
        // console.log('Status:', updateTo);
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
        api.postForm(url, form)
            .then(() => RefreshBadgeEvent.emit())
            .then(() => setResolved(true))
            .then(() => (window.location.href = '/inbox'))
            .catch((err) => {});
    };

    useEffect(() => {
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
            label: 'Gaul Related',
            disabled: !ticket.gaul,
        },
    ];
    return (
        <div className="tc-detail-container">
            <div className="tc-detail-content">
                {/* <Typography.Title level={3}>Tiket {ticket.no}</Typography.Title>
                <Divider /> */}
                {/* <Form>
                    <Form.Item colon label="Service">
                        <Input defaultValue={ticket.serviceNo} disabled />
                    </Form.Item>
                    <Form.Item colon label="Tiket NOSSA">
                        <Input defaultValue={ticket.incidentNo} disabled />
                    </Form.Item>
                </Form> */}
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
                    <Descriptions.Item label="Evidence" span={5}>
                        {ticket.assets ? null : <i>*Empty*</i>}
                    </Descriptions.Item>
                </Descriptions>
                <Tabs type="line" items={tabItems} />
            </div>
            <div className="tc-detail-info">
                <Card
                    title="Update Submission"
                    size="small"
                    actions={[
                        <Button
                            type="primary"
                            key="submit-btn"
                            title="Submit work log"
                            icon={<CheckOutlined />}
                            onClick={onSubmit}
                        >
                            Submit
                        </Button>,
                    ]}
                >
                    <Form form={submission} layout="vertical">
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
                data: null,
                logs: [],
                error: true,
            },
        };
    } else {
        const config = api.auhtHeader(session);
        const res = await api.get(`/ticket/${ticketNo}`, config).catch((err) => err);

        if (axios.isAxiosError(res)) {
            return {
                props: {
                    data: null,
                    logs: [],
                    error: true,
                },
            };
        } else {
            const data: DTO.Ticket = res.data;
            const logRes = await api.get(`/ticket/logs/${ticketNo}`, config);
            const agentRes = await api.get<DTO.TicketAgent[]>(
                `/ticket/agents/${ticketNo}`,
                config
            );

            return {
                props: {
                    data,
                    logs: logRes.data,
                    agents: agentRes.data,
                    error: false,
                },
            };
        }
    }
}

export default TicketDetail;

interface TicketDetailProps {
    data: DTO.Ticket;
    logs: DTO.TicketLog[];
    agents: DTO.TicketAgent[];
    error: boolean;
}
