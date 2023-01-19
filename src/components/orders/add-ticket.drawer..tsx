import { InboxOutlined } from '@ant-design/icons';
import { isStr } from '@mars/common';
import {
    AutoComplete,
    Button,
    Drawer,
    Form,
    Input,
    message,
    Select,
    Space,
    Upload,
    UploadFile,
} from 'antd';
import type { Rule, RuleObject } from 'antd/lib/form/index';
import type { DefaultOptionType } from 'antd/lib/select/index';
import { RcFile } from 'antd/lib/upload/interface';
import { AxiosError } from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import type { BaseInputProps } from '_comp/table/input.fields';
import { useApp } from '_ctx/app.ctx';
import notif from '_service/notif';
import { CopyAsGaulTicketEvent } from '_utils/events';

const AcceptableFileExt = ['.jpg', '.jpeg', '.png', '.webp'];

export function AddTicketDrawer(props: AddOrderDrawerProps) {
    const router = useRouter();
    const app = useApp();
    const [form] = Form.useForm();
    const watchIssueId = Form.useWatch(['issue'], form);

    const [loading, setLoading] = useState(false);
    const [attachments, setAttachments] = useState<UploadFile[]>([]);
    const [issues, setIssues] = useState<DTO.Issue[]>([]);
    const [autoCompOptions, setAutoCompOptions] = useState<DefaultOptionType[]>([]);

    const onSubmit = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();
            console.log(values);

            const {
                issue: { value: issueId },
                ...others
            } = values;

            const prepare = {
                ...others,
                issue: issueId,
                product,
            };

            const formData = new FormData();
            for (const k in prepare) formData.set(k, prepare[k]);
            for (const file of attachments) {
                formData.append('files', file as RcFile, file.fileName);
            }

            await api
                .post('/ticket/wip', formData)
                .then((res) =>
                    message.success('Berhasil menambah tiket dengan no ' + res.data.no)
                )
                .then(() => router.reload())
                .catch((err: AxiosError) => notif.error(err, 5))
                .finally(() => setLoading(false));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getIssues = () => {
        api.get<DTO.Issue[]>('/issue', {
            params: {
                size: 1000,
            },
        })
            .then((res) => {
                setIssues(res.data);
                const grouped = res.data.reduce((a, b) => {
                    const m = a.get(b.product) || [];
                    m.push(b);
                    a.set(b.product, m);
                    return a;
                }, new Map<Mars.Product, DTO.Issue[]>());

                const result: DefaultOptionType[] = [];
                for (const [product, issues] of grouped) {
                    result.push({
                        label: `Produk ${product}`,
                        options: issues.map((issue) => ({
                            label: issue.name,
                            value: issue.id,
                        })),
                    });
                }
                setAutoCompOptions(result.reverse());
            })
            .catch((err) => err);
    };

    const onClose = () => {
        form.resetFields();
        props.onClose?.();
    };

    const action = (
        <Space>
            <Button type="primary" loading={loading} onClick={onSubmit}>
                Tambah
            </Button>
        </Space>
    );

    useEffect(() => {
        getIssues();
    }, []);
    useEffect(() => {
        const duplicateGaulListener = (event: Event) => {
            if (!(event instanceof CopyAsGaulTicketEvent)) return;
            const { serviceNo, incidentNo, witel, sto, issue } = event.data;
            form.setFieldsValue({
                serviceNo,
                incidentNo,
                witel,
                sto,
                issue: {
                    value: issue.id,
                    label: issue.name,
                    key: issue.id,
                },
            });
        };

        window.addEventListener('dup-ticket', duplicateGaulListener);
        return () => window.removeEventListener('dup-ticket', duplicateGaulListener);
    }, []);

    const product = issues.find((e) => {
        if (isStr(watchIssueId)) return watchIssueId === e.id
        return watchIssueId?.value === e.id;
    })?.product;
    return (
        <Drawer
            title="Tambah Tiket"
            width={500}
            open={props.open}
            onClose={onClose}
            extra={action}
        >
            <Form form={form} layout="vertical">

                <Form.Item
                    label="Problem"
                    name="issue"
                    required
                    rules={[VALIDATOR.required('Nama Masalah')]}
                >
                    <Select
                        labelInValue
                        options={autoCompOptions}
                        placeholder="type to search"
                        allowClear
                    />
                </Form.Item>
                <Form.Item
                    label="Tiket NOSSA"
                    name="incidentNo"
                    required
                    rules={[VALIDATOR.incidentNo(product)]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label="Service"
                    name="serviceNo"
                    required
                    rules={[VALIDATOR.serviceNo(product)]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label="Witel"
                    name="witel"
                    initialValue={app.witel}
                >
                    <Select options={mapEnum(Mars.Witel)} />
                </Form.Item>
                <Form.Item
                    label="STO"
                    name="sto"
                >
                    <Input />
                </Form.Item>

                <Form.Item label="Deskripsi" name="note">
                    <Input.TextArea />
                </Form.Item>
                <Form.Item label={<b>Attachments</b>}>
                    <Form.Item name="files" noStyle>
                        <Upload.Dragger
                            multiple
                            fileList={attachments}
                            name="files"
                            accept={AcceptableFileExt.join(', ')}
                            onRemove={(file) => {
                                const index = attachments.indexOf(file);
                                const copy = [...attachments];
                                copy.splice(index, 1);
                                setAttachments(copy);
                            }}
                            beforeUpload={(file) => {
                                setAttachments((prev) => [...prev, file]);
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
                                <br />
                                (only accept image type)
                                {/* Support for a single or bulk upload. */}
                            </p>
                        </Upload.Dragger>
                    </Form.Item>
                </Form.Item>
            </Form>
        </Drawer>
    );
}

export interface AddOrderDrawerProps {
    open?: boolean;
    onClose?(): void;
}

// witel: JAKTIM
// sto: WRE
// incident: IN897222
// issue: network
// product: IPTV
// service: 123868944
// note: internet lemot mohon diperbaiki

const REGX_SERVICE_IPTV_INTRA = /^1(\d+)$/i;
const REGX_SERVICE_VOICE = /^[+\d](\d+)$/i;
const REGX_INCIDENT = /^(in)\d{9}$/i;

const VALIDATOR = {
    required: (fieldName: string) => ({
        required: true,
        whitespace: false,
        message: `${fieldName} tidak boleh kosong`,
        validator(rule, value, callback) {
            if (!value) return callback(rule.message as string);
            callback();
        },
    }),
    incidentNo: (product?: Mars.Product) => (form) => ({
        validator(rule: RuleObject, value: string, callback: (error?: string) => void) {
            console.log(form.getFieldValue('issue'));

            if (!value || !value.trim())
                return callback('Tiket NOSSA tidak boleh kosong');
            else if (!product)
                return callback('Silahkan tentukan jenis produk berdasarkan nama issue');

            const isValid = REGX_INCIDENT.test(value);
            if (!isValid) callback(VALIDATION_MESSAGES.INCIDENTNO);
            else callback();
        },
    }),
    serviceNo: (product?: Mars.Product) => (form) => {
        return {
            validator(rule, value, callback) {
                if (!value || !value.trim())
                    return callback('No Service tidak boleh kosong');
                else if (!product)
                    return callback(
                        'Silahkan tentukan jenis produk berdasarkan nama Problem/Issue'
                    );

                if ([Mars.Product.IPTV, Mars.Product.INTERNET].includes(product)) {
                    const isValid = REGX_SERVICE_IPTV_INTRA.test(value);
                    if (!isValid) callback(VALIDATION_MESSAGES.SERVICENO);
                    else callback();
                } else {
                    const isValid = REGX_SERVICE_VOICE.test(value);
                    if (!isValid) callback(VALIDATION_MESSAGES.SERVICENO);
                    else callback();
                }
            },
        };
    },
} satisfies map<(...args: any[]) => Rule>;

function mapEnum<T extends map>(o: T) {
    const values = Object.values(o).filter((e) => !/^(\d)+$/.test(e));
    return values.map<DefaultOptionType>((e) => ({ label: e, value: e }));
}

function IssueInput(props: BaseInputProps) {
    // const [product, setProduct] = useState<Mars.Product>(props.value?.product);
    // const [issue, setIssue] = useState<string>(props.value?.issue);
    const form = Form.useFormInstance();
    const watchProduct = Form.useWatch(['product'], form);
    const [autoCompOptions, setAutoCompOptions] = useState<DefaultOptionType[]>([]);

    const onSearch = (value: string) => {
        api.get<DTO.Issue[]>('/issue', {
            params: {
                name: {
                    like: value,
                },
                product: {
                    eq: watchProduct,
                },
            },
        })
            .then((res) => {
                setAutoCompOptions(
                    res.data.map((e) => ({
                        id: e.id,
                        label: e.name,
                        value: e.name,
                    }))
                );
            })
            .catch((err) => err);
    };

    return (
        <Space>
            <Form.Item label="Produk">
                <Select options={mapEnum(Mars.Product)} />
            </Form.Item>

            <Form.Item label="Nama Masalah" name="issue">
                <AutoComplete
                    options={autoCompOptions}
                    placeholder="type to search"
                    onSearch={onSearch}
                />
            </Form.Item>
        </Space>
    );
}

const VALIDATION_MESSAGES = {
    INCIDENTNO: 'Format text salah, prefix IN dengan suffix 9 digit angka',
    SERVICENO: `Jika product-type sama dengan INTERNET/IPTV:
    - nilai berupa deret angka
    - dimulai dengan angka 1
    <br />
    Jika product-type sama dengan VOICE:
    - format nomor telepon, bebas`,
};
