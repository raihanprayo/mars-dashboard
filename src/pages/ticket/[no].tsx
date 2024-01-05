import {
    AuditOutlined,
    CheckOutlined,
    CopyOutlined,
    DoubleRightOutlined,
    DownloadOutlined,
    EyeOutlined,
    FileExcelOutlined,
    FileImageOutlined,
    FileOutlined,
    FilePdfOutlined,
    FileZipOutlined,
    InboxOutlined,
    InfoCircleOutlined,
    LoginOutlined,
    RightSquareOutlined,
    SendOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { HttpHeader, isDefined } from "@mars/common";
import {
    Button,
    Descriptions,
    Divider,
    Form,
    Image,
    Input,
    List,
    message,
    Modal,
    Radio,
    Space,
    Tabs,
    Timeline,
    Typography,
    Upload,
} from "antd";
import type { Tab } from "rc-tabs/lib/interface";
import axios from "axios";
import { NextPageContext } from "next";
import { getSession, useSession } from "next-auth/react";
import { Render } from "_comp/value-renderer";
import Card from "antd/lib/card/Card";
import {
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import type { RcFile, UploadFile } from "antd/lib/upload";
import { RefreshBadgeEvent } from "_utils/events";
import { PageContext, usePage } from "_ctx/page.ctx";
import { useRouter } from "next/router";
import Link from "next/link";
import { format } from "date-fns";
import { CopyToClipboard, MarsButton } from "_comp/base";
import notif from "_service/notif";
import { SolutionSelect } from "_comp/table/input.fields";
import Head from "next/head";
import { CreatedBy } from "_comp/base/CreatedBy";
import { scanAssets, ScannedAsset, WorklogAsset } from "_utils/fns/scan-asset";
import { IMAGE_FILE_EXT } from "_utils/constants";
import { useUser } from "_hook/credential.hook";
import { BoolHook, useBool } from "_hook/util.hook";
import { Mars } from "@mars/common/types/mars";

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
    console.log("View Only Mode?", props.viewOnly);
    const ticket: DTO.Ticket = props.data || ({} as any);
    const route = useRouter();
    const session = useSession();

    const pageCtx = usePage();
    const [submission] = Form.useForm();
    const [resolved, setResolved] = useState(false);
    const [files, setFiles] = useState<UploadFile[]>([]);
    const openAsset = useBool();

    const description = Form.useWatch("description", submission);
    const status = Form.useWatch("status", submission);
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
            session.status === "authenticated" &&
            ticket.wipBy !== session.data?.user?.id;

        return invalidStat || invalidProgress;
    }, [ticket]);

    const onSubmit = async () => {
        try {
            await submission.validateFields();
        } catch (err) {
            return;
        }

        const form = new FormData();
        const solution = submission.getFieldValue("solution")?.value;

        form.set("note", description);
        if (solution) form.set("solution", solution);
        for (const file of files)
            form.append("files", file as RcFile, file.fileName);

        const statusLink =
            status === Mars.Status.CLOSED
                ? "close"
                : status === Mars.Status.DISPATCH
                ? "dispatch"
                : "pending";

        const url = `/ticket/wip/${statusLink}/${ticket.id}`;

        pageCtx.setLoading(true);
        api.postForm(url, form)
            .then(() => RefreshBadgeEvent.emit())
            .then(() => setResolved(true))
            .then(() => (window.location.href = "/inbox"))
            .catch((err) => notif.error(err))
            .finally(() => pageCtx.setLoading(false));
    };

    const onPaste = async (event: ClipboardEvent | React.ClipboardEvent) => {
        const data = event.clipboardData;
        if (data && !disableSubmit) {
            const files: File[] = [];
            for (const file of data.files) {
                const isImage = file.type.toLowerCase().startsWith("image/");
                if (isImage) files.push(file);
            }

            if (files.length > 0) {
                setFiles((p) => [...p, ...(files as any)]);
            }
        }
    };

    const onGetContact = async () => {
        if (!props.contact) return;

        api.get("/telegram/send/contact/" + props.contact.nik)
            .then(() => message.info("Kontak info berhasil dikirim"))
            .catch(notif.axiosError);
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
            route.events.emit("routeChangeError");
            throw "routeChange aborted";
        };

        addEventListener("beforeunload", handleWindowClose);
        route.events.on("routeChangeStart", handleBrowseAway);
        return () => {
            removeEventListener("beforeunload", handleWindowClose);
            route.events.off("routeChangeStart", handleBrowseAway);
        };
    }, [description, files]);

    useEffect(() => {
        document.addEventListener("paste", onPaste);
        return () => document.removeEventListener("paste", onPaste);
    }, []);

    if (props.error) {
        return <>Cannot get Ticket detail</>;
    }

    const logs = useMemo(() => [...props.logs].reverse(), [props.logs]);

    const tabItems: Tab[] = [
        {
            key: "dt-timeline",
            label: "Timeline",
            children: (
                <Timeline mode="left">
                    {logs.map((log, i) => {
                        const d = Render.date(
                            log.createdAt,
                            Render.DATE_WITH_TIMESTAMP
                        );
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
            key: "dt-gaul",
            label: "Gaul Relation",
            disabled: !ticket.gaul,
            children: <GaulRelation relations={props.relation} />,
        },
        {
            key: "dt-agent",
            label: "Workspaces",
            disabled: props.workspaces.length < 1,
            children: (
                <>
                    {(props.workspaces || [])
                        .sort((a, b) => a.id - b.id)
                        .reverse()
                        .map((ws) => (
                            <Workspaces key={"workspace-" + ws.id} ws={ws} />
                        ))}
                </>
            ),
        },
    ];

    const watchStat = Form.useWatch("status", submission);

    const contact = {
        name: props.data.senderName || "-",
        phone: props.contact?.phone || "-",
        get link() {
            if (!props.contact?.phone) return;

            let phone = props.contact.phone;

            if (phone.startsWith("+62")) phone = phone;
            else phone = "+62" + phone.substring(1);
            return "https://t.me/" + phone;
        },
    };

    // console.log(props.assets);
    return (
        <DetailContext.Provider
            value={{ ticket: props.data, assets: props.assets }}
        >
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
                            <CopyToClipboard
                                data={ticket.incidentNo}
                                withIcon
                            />
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
                            {Render.tags({ bold: true, statusDisplay: true })(
                                ticket.sto
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item label="Sumber">
                            {Render.tags({ bold: true, statusDisplay: true })(
                                ticket.source
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Note" span={3}>
                            {ticket.note ?? <i>*Empty*</i>}
                        </Descriptions.Item>

                        <Descriptions.Item label="Kontak Pelapor" span={5}>
                            <Space direction="vertical">
                                <span>Nama: {contact.name}</span>
                                <span>No. HP: {contact.phone}</span>
                                <Button.Group>
                                    <Button
                                        type="primary"
                                        // size="small"
                                        onClick={onGetContact}
                                        icon={<UserOutlined />}
                                    >
                                        Get
                                    </Button>
                                    <Button
                                        type="primary"
                                        // size="small"
                                        href={contact.link}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        icon={<SendOutlined />}
                                    >
                                        Chat
                                    </Button>
                                </Button.Group>
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Attachments" span={5}>
                            <SharedAsset
                                assets={props.assets.assets}
                                emptyWithText
                            />
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
                                    {
                                        required: true,
                                        message: "Status update required",
                                    },
                                ]}
                            >
                                <Radio.Group
                                    buttonStyle="solid"
                                    disabled={disableSubmit}
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

                            <Form.Item
                                label={<b>Actual Solution</b>}
                                name="solution"
                                // required={[Mars.Status.CLOSED].includes(status)}
                                rules={[
                                    {
                                        required: [Mars.Status.CLOSED, Mars.Status.PENDING].includes(status),
                                        message: 'Actsol tidak boleh kosong'
                                    }
                                ]}
                            >
                                <SolutionSelect disabled={disableSubmit} />
                            </Form.Item>


                            <Form.Item label={<b>Attachments</b>}>
                                <Form.Item name="files" noStyle>
                                    <Upload.Dragger
                                        disabled={disableSubmit}
                                        multiple
                                        fileList={files}
                                        name="files"
                                        accept={IMAGE_FILE_EXT.join(", ")}
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
                                            Click or drag file to this area to
                                            upload
                                            {/* Support for a single or bulk upload. */}
                                        </p>
                                    </Upload.Dragger>
                                </Form.Item>
                            </Form.Item>

                            <Form.Item
                                label={<b>Worklog</b>}
                                name="description"
                                rules={[
                                    {
                                        required:
                                            watchStat !== Mars.Status.DISPATCH,
                                        message: "Worklog tidak boleh kosong",
                                    },
                                ]}
                            >
                                <Input.TextArea
                                    placeholder="work description"
                                    disabled={disableSubmit}
                                />
                            </Form.Item>
                        </Form>
                    </Card>
                </div>
            </div>

            {/* <ListAssets open={openAsset} /> */}
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
                    title: "Unauthorized",
                    detail: "Full authentication required to access this resource",
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
                title: "Internal Error",
                detail: res.message,
            };
            return {
                props: {
                    error: errorData,
                },
            };
        } else {
            const viewOnly = "viewOnly" in ctx.query;
            const data: DTO.Ticket = res.data;
            const logRes = await api.get(
                `/ticket/detail/${ticketNo}/logs`,
                config
            );
            const relatedRes = await api.get<DTO.Ticket[]>(
                `/ticket/detail/${ticketNo}/relation`,
                { ...config, params: { wip: { in: [true, false] } } }
            );
            const workspacesRes = await api.get<DTO.AgentWorkspace[]>(
                `/ticket/detail/${ticketNo}/workspaces`,
                { ...config, params: { full: true } }
            );

            const contactRes = await api.get<DTO.Users>(
                `/ticket/detail/${ticketNo}/contact`,
                { ...config }
            );

            const result: NextServerSideProps<TicketDetailProps> = {
                props: {
                    data,
                    contact: contactRes.data,
                    logs: logRes.data,
                    workspaces: workspacesRes.data,
                    relation: relatedRes.data.filter((e) => e.id !== data.id),
                    assets: scanAssets(data, workspacesRes.data),
                    viewOnly,
                },
            };

            return result;
        }
    }
}

export default TicketDetail;

interface TicketDetailProps {
    data: DTO.Ticket;
    contact: DTO.Users;
    logs: DTO.TicketLog[];
    workspaces: DTO.AgentWorkspace[];
    relation: DTO.Ticket[];
    assets: ScannedAsset;
    error: any;
    viewOnly: boolean;
}

function SharedAsset(props: SharedAssetProps) {
    const { assets = [] } = props;
    if (!isDefined(assets) || assets.length === 0) {
        if (!props.emptyWithText) return <></>;
        return <i className="text-primary">* No Attachment</i>;
    }

    const copyImage = useCallback(async (path: string) => {
        const url = "/api/shared" + (path.startsWith("/") ? "" : "/") + path;
        try {
            let img = BlobCache.get(url);
            if (!img) {
                img = {} as ImageHolder;
                const res = await fetch(url);

                img.type = res.headers.get(HttpHeader.CONTENT_TYPE);
                img.data = await res.blob();
                BlobCache.set(url, img);
            }

            
            await navigator.clipboard.write([
                new ClipboardItem({ [img.type]: img.data }),
            ]);
            message.success("Image copied to clipboard");
        } catch (ex) {
            console.error(ex);
            notif.error(ex);
        }
    }, []);

    const previewImage = (asset: SharedAsset) => {
        const url =
            "/api/shared" +
            (asset.path.startsWith("/") ? "" : "/") +
            asset.path;
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.click();
    };

    const downloadAction = (asset: SharedAsset) => {
        const url =
            "/api/shared" +
            (asset.path.startsWith("/") ? "" : "/") +
            asset.path;
        axios.get(url, { responseType: "blob" }).then((res) => {
            const href = URL.createObjectURL(res.data);
            const link = document.createElement("a");
            link.href = href;
            link.setAttribute("download", asset.name);
            link.click();

            URL.revokeObjectURL(href);
        });
    };

    const actions = (asset: SharedAsset) => {
        const iconStyle = {
            color: "black",
            fontSize: 18,
        };

        const actions: ReactNode[] = [];
        if (asset.previewable) {
            actions.push(
                <Button
                    type="text"
                    title="Preview"
                    icon={<EyeOutlined style={iconStyle} />}
                    onClick={() => previewImage(asset)}
                />,
                <Button
                    type="text"
                    title="Copy"
                    icon={<CopyOutlined style={iconStyle} />}
                    onClick={() => copyImage(asset.path)}
                />
            );
        } else {
            actions.push(
                <Button
                    type="text"
                    onClick={() => downloadAction(asset)}
                    icon={
                        <DownloadOutlined title="Download" style={iconStyle} />
                    }
                />
            );
        }
        return actions;
    };

    const datasource: SharedAsset[] = assets.map<SharedAsset>((asset) => {
        const name = asset.substring(asset.lastIndexOf("/") + 1);
        const extension = name.substring(name.lastIndexOf(".") + 1);

        let icon: any;
        let previewable = false;
        switch (extension) {
            case "jpg":
            case "jpeg":
            case "png":
            case "webp":
                icon = FileImageOutlined;
                previewable = true;
                break;
            case "pdf":
                icon = FilePdfOutlined;
                break;
            case "xlsx":
            case "xls":
                icon = FileExcelOutlined;
                break;
            case "zip":
            case "rar":
                icon = FileZipOutlined;
                break;
            default:
                icon = FileOutlined;
                break;
        }
        return {
            name,
            icon,
            extension,
            previewable,
            path: asset,
        };
    });

    return (
        <List
            className="ticket-shared-asset"
            dataSource={datasource}
            renderItem={(item, index) => (
                <List.Item
                    title={`${item.previewable ? "Image" : "Dokumen"}: ${
                        item.name
                    }`}
                    actions={actions(item)}
                >
                    <List.Item.Meta
                        title={
                            <Space>
                                {item.icon ? (
                                    <item.icon style={{ fontSize: 17 }} />
                                ) : null}
                                {item.name}
                            </Space>
                        }
                    />
                </List.Item>
            )}
        />
    );
    // return (
    //     <Image.PreviewGroup>
    //         {assets.map((path) => {
    //             const src = '/api/shared' + (path.startsWith('/') ? '' : '/') + path;
    //             return (
    //                 <Image
    //                     key={path}
    //                     alt={path}
    //                     // width={200}
    //                     height={85}
    //                     src={src}
    //                     preview={{
    //                         title: (
    //                             <Space>
    //                                 <CopyOutlined
    //                                     size={30}
    //                                     onClick={() => copyImage(src)}
    //                                 />
    //                             </Space>
    //                         ),
    //                     }}

    //                     // fallback="data:image/png;base64,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"
    //                 />
    //             );
    //         })}
    //     </Image.PreviewGroup>
    // );
}
interface SharedAssetProps {
    assets?: string[];
    emptyWithText?: boolean;
}
interface SharedAsset {
    name: string;
    extension: string;
    path: string;
    icon?: any;
    previewable: boolean;
}

function GaulRelation(props: { relations: DTO.Ticket[] }) {
    const { relations = [] } = props;

    return (
        <List
            className="tc-detail-relations"
            itemLayout="vertical"
            dataSource={relations}
            renderItem={(item) => {
                const title = (
                    <Link href={`/ticket/${item.no}`}>Tiket - {item.no}</Link>
                );

                const description = (
                    <p className="text-primary">
                        Created:{" "}
                        {format(
                            new Date(item.createdAt),
                            Render.DATE_WITH_TIMESTAMP
                        )}
                        , By: {item.createdBy}
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
    const extra = (
        <Space>{Render.date(ws.createdAt, Render.DATE_WITH_TIMESTAMP)}</Space>
    );
    return (
        <Card
            title={title}
            size="small"
            extra={extra}
            style={{ marginBottom: "1rem" }}
        >
            {ws.worklogs
                .sort((a, b) => a.id - b.id)
                .reverse()
                .map((wl) => (
                    <WorklogView
                        key={`worklog:${ws.id}-` + wl.id}
                        ws={ws}
                        wl={wl}
                    />
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
            {wl.closeStatus || (
                <span className="text-primary">* Sedang Dikerjakan</span>
            )}
        </Space>
    );

    const extra = (
        <Space>{Render.date(wl.createdAt, Render.DATE_WITH_TIMESTAMP)}</Space>
    );
    const messageFooter = (
        <>
            <Divider style={{ margin: "10px 0" }} />
            <p>{wl.reopenMessage || "-"}</p>
            <SharedAsset assets={assets?.requestor} />
        </>
    );
    return (
        <Card type="inner" size="small" title={title} extra={extra}>
            {wl.message && <p>{wl.message || "-"}</p>}
            {assets.assets && <SharedAsset assets={assets.assets} />}

            {isDefined(wl.reopenMessage) && messageFooter}
        </Card>
    );
}

function ListAssets(props: { open: BoolHook }) {
    const ctx = useContext(DetailContext);

    return (
        <Modal>
            <List
                dataSource={[{}]}
                renderItem={(item, index) => (
                    <List.Item>Ini Item {index}</List.Item>
                )}
            />
        </Modal>
    );
}
