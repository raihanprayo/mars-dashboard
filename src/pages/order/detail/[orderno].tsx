import {
    PaperClipOutlined,
    ReloadOutlined,
    DeleteOutlined,
    FilePdfOutlined,
    FileImageOutlined,
    FileTextOutlined,
    FileUnknownOutlined,
} from '@ant-design/icons';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Input, Button, Row, Col, Typography, Divider } from 'antd';
import { useRouter } from 'next/router';
import { NextPageContext } from 'next';
import { Render } from '_comp/value-renderer';
import { HttpHeader, mergeClassName, MimeType } from '@mars/common';
import getConfig from 'next/config';
import { OrderSider } from '_comp/orders/order-sider.info';
import axios from 'axios';
import ThumbnailDrawer from '_comp/thumbnail.drawer';

const { TextArea } = Input;
const AcceptableFileExt = ['.jpg', '.jpeg', '.png', '.webp'];
const IconMimeType = (mime: string) => {
    switch (mime) {
        case MimeType.IMAGE_JPG:
        case MimeType.IMAGE_JPG:
        case MimeType.IMAGE_WEBP:
        case MimeType.IMAGE_PNG:
            return FileImageOutlined;
        case MimeType.APPLICATION_PDF:
            return FilePdfOutlined;
        case MimeType.TEXT_PLAIN:
            return FileTextOutlined;
    }
    return FileUnknownOutlined;
};

const DetailSpanCtx = createContext<DetailItemProps['spans']>({});

export default function DetailOrderPage(props: DetailOrderProps) {
    const route = useRouter();
    const config: NextAppConfiguration = getConfig();
    const [worklog, setWorklog] = useState('');

    const [uploads, setUploads] = useState<File[]>([]);
    const [uploadEl, setUploadEl] = useState<HTMLInputElement>();

    const [resolved, setResolved] = useState(false);
    const unsaved = useMemo(() => {
        if (worklog) return true;
        if (uploads.length) return true;
        return false;
    }, [uploads, worklog]);

    const [drawerAssignment, setDrawerAssignment] = useState<DTO.OrderAssignment>();

    console.log(uploads);
    const order = props.data;
    if (props.error) {
        const { status, message, code } = props.error;
        return (
            <div className="err-container">
                <div className="wrap">
                    <Typography.Title type="danger" level={4}>
                        {status} | {code}
                    </Typography.Title>
                </div>
                <div className="wrap">
                    <Typography.Title level={5}>{message}</Typography.Title>
                    <Button
                        type="dashed"
                        icon={<ReloadOutlined />}
                        onClick={() => window.location.reload()}
                    >
                        refresh the page
                    </Button>
                </div>
            </div>
        );
    }

    const age = Render.calcOrderAge(order.opentime);
    const problem: DTO.Problem = order.problemtype as any;

    const expandSpan = !!order.gaul || order.assignments.length > 1;
    const detailSpans: Exclude<DetailItemProps['spans'], undefined> = {
        title: expandSpan ? 8 : 6,
        separator: 1,
        value: expandSpan ? 15 : 17,
    };

    const onDetailBtnClick = useCallback(
        (s: Mars.Status.CLOSED | Mars.Status.DISPATCH | Mars.Status.PENDING) => () => {
            const form = new FormData();

            form.append('description', worklog);
            for (const file of uploads) form.append('files', file, file.name);

            console.log('Uploading', [...form]);
            updateStatus[s](order.id, form)
                .then(() => window.dispatchEvent(new Event('refresh-badge')))
                .then(() => setResolved(true))
                .then(() => route.push('/inbox'))
                .catch((err) => console.error(err));
        },
        [worklog]
    );

    const onUploadChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => setUploads([...e.target.files]),
        [uploadEl]
    );

    const removeFile = (index: number) => {
        const u = [...uploads];
        u.splice(index, 1);
        setUploads(u);

        const dt = new DataTransfer();
        for (const file of u) dt.items.add(file);
        uploadEl.files = dt.files;
    };

    useEffect(() => {
        const leaveMessage = `You have unsaved changes, are you sure you wish to leave this page?`;

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
    }, [resolved]);

    return (
        <ThumbnailDrawer.Provider>
            <div style={{ display: 'flex' }}>
                <div className="detail-left">
                    <DetailSpanCtx.Provider value={detailSpans}>
                        <Row>
                            <Col span={12}>
                                <DetailItem label="Order No">{order.orderno}</DetailItem>
                                <DetailItem label="No Service">
                                    {order.serviceno}
                                </DetailItem>
                                <DetailItem label="Tiket NOSSA">
                                    {order.incidentno}
                                </DetailItem>
                                <DetailItem label="Status">
                                    {Render.orderStatus(order.status, true)}
                                </DetailItem>
                            </Col>
                            <Col span={12}>
                                <DetailItem label="Umur Order">
                                    {age.hour}j {age.minute}m
                                </DetailItem>
                                <DetailItem label="Umur Action">0m</DetailItem>
                                <DetailItem label="Kendala">{problem.name}</DetailItem>
                                <DetailItem label="Keterangan">
                                    <Typography.Text>
                                        {order.notes || '-'}
                                    </Typography.Text>
                                </DetailItem>
                            </Col>
                        </Row>
                        <Divider />
                        <Row>
                            <Col span={12}>
                                <DetailItem label="Pengirim">
                                    {order.sendername}
                                </DetailItem>
                                <DetailItem label="Service Type">
                                    {Render.product(order.producttype)}
                                </DetailItem>
                                <DetailItem label="Request Type">
                                    {problem.name}
                                </DetailItem>
                                <DetailItem label="Witel">{order.witel}</DetailItem>
                                <DetailItem label="STO">{order.sto}</DetailItem>
                            </Col>
                            <Col span={12}>
                                <DetailItem
                                    label="Evidence"
                                    spans={{
                                        value: order.attachment ? 24 : undefined,
                                    }}
                                >
                                    {!order.attachment ? (
                                        '-'
                                    ) : (
                                        <img
                                            src={
                                                config.publicRuntimeConfig.service
                                                    .file_url + order.attachment
                                            }
                                            alt={order.attachment || 'no image'}
                                            style={{ width: '80%' }}
                                        />
                                    )}
                                </DetailItem>
                            </Col>
                        </Row>
                    </DetailSpanCtx.Provider>
                </div>
                <div
                    className={mergeClassName('detail-right', {
                        get hide() {
                            if (order.gaul > 0) return false;
                            else if (order.assignments.length > 1) return false;
                            return true;
                        },
                    })}
                >
                    <OrderSider order={order} />
                </div>
            </div>
            <Divider />
            <form
                className="detail-work"
                method="post"
                onSubmit={(e) => e.preventDefault()}
            >
                <div
                    className={mergeClassName('detail-uploads', {
                        empty: uploads.length < 1,
                    })}
                >
                    <Button
                        className="upload-btn"
                        type="primary"
                        size={uploads.length > 0 ? 'small' : 'middle'}
                        icon={<PaperClipOutlined />}
                        children={uploads.length > 0 ? 'Upload' : undefined}
                        onClick={() => uploadEl.click()}
                    />
                    <ul className="upload-list">
                        {uploads.map((e, i) => {
                            const Icon = IconMimeType(e.type);
                            return (
                                <li
                                    key={'upload-item:' + i}
                                    className="upload-item"
                                    title={e.name}
                                >
                                    <div className="upload-detail filename">
                                        <span className="icon" children={<Icon />} />
                                        <span className="title">{e.name}</span>
                                    </div>
                                    <div className="upload-detail action">
                                        <Button
                                            type="text"
                                            icon={<DeleteOutlined />}
                                            title="remove upload"
                                            onClick={() => removeFile(i)}
                                        />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
                <div className="detail-worklog">
                    <input
                        ref={setUploadEl}
                        name="files"
                        type="file"
                        multiple
                        accept={AcceptableFileExt.join(', ')}
                        style={{ display: 'none' }}
                        onChange={onUploadChange}
                    />
                    <TextArea
                        name="description"
                        placeholder="worklog..."
                        value={worklog}
                        onChange={(e) => setWorklog(e.target.value)}
                    />
                </div>
                <div className="detail-button">
                    <div className="detail-button-container">
                        <Button
                            type="primary"
                            block
                            onClick={onDetailBtnClick(Mars.Status.CLOSED)}
                            className="d-btn close"
                            // htmlType="submit"
                        >
                            <b>Close</b>
                        </Button>
                        <Button
                            type="primary"
                            block
                            onClick={onDetailBtnClick(Mars.Status.DISPATCH)}
                            className="d-btn dispatch"
                            // htmlType="submit"
                        >
                            <b>Dispatch</b>
                        </Button>
                        <Button
                            type="primary"
                            block
                            onClick={onDetailBtnClick(Mars.Status.PENDING)}
                            className="d-btn pending"
                            // htmlType="submit"
                        >
                            <b>Pending</b>
                        </Button>
                    </div>
                </div>
            </form>
        </ThumbnailDrawer.Provider>
    );
}

DetailOrderPage.getInitialProps = async (ctx: NextPageContext) => {
    const orderno = ctx.query.orderno;
    try {
        const res = await getOrder(orderno as string);
        console.log('* Order Detail', res.data);
        return { data: res.data };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            switch (error.code) {
                case NodeJS.SystemErr.ECONNREFUSED: {
                    return {
                        error: {
                            code: error.code,
                            status: 500,
                            message: 'Unable to connect to core-service',
                        },
                    };
                }

                default:
                    break;
            }
        }
    }

    return { error: 'Internal Server Error' };
};

function DetailItem(props: DetailItemProps) {
    const ctx = useContext(DetailSpanCtx);
    const {
        title = ctx.title,
        separator = ctx.separator,
        value = ctx.value,
    } = props.spans || {};
    return (
        <Row>
            <Col span={title}>
                <Typography.Title keyboard level={5}>
                    {props.label}
                </Typography.Title>
            </Col>
            <Col span={separator}>:</Col>
            <Col span={value}>{props.children}</Col>
        </Row>
    );
}

function getOrder(no: string, params: map = {}) {
    const url = `/order/by-noorder/${no}`;
    return api.get<DTO.Orders>(url, { params });
}

interface DetailOrderProps {
    data: DTO.Orders;
    error?: any;
}
interface DetailItemProps {
    label: string;
    spans?: {
        title?: number;
        separator?: number;
        value?: number;
    };
    children: React.ReactNode;
}

const updateStatusUrl = '/order/update/status/dashboard';
const updateStatus = {
    update(id: string, status: Mars.Status, formData: FormData) {
        return api
            .put<DTO.OrderAssignment>(`${updateStatusUrl}/${id}/${status}`, formData, {
                headers: {
                    [HttpHeader.CONTENT_TYPE]: MimeType.MUTLIPART_FORM_DATA,
                },
            })
            .then((res) => res.data);
    },
    [Mars.Status.CLOSED](id: string, formData: FormData) {
        return updateStatus.update(id, Mars.Status.CLOSED, formData);
    },
    [Mars.Status.DISPATCH](id: string, formData: FormData) {
        return updateStatus.update(id, Mars.Status.DISPATCH, formData);
    },
    [Mars.Status.PENDING](id: string, formData: FormData) {
        return updateStatus.update(id, Mars.Status.PENDING, formData);
    },
} as const;
