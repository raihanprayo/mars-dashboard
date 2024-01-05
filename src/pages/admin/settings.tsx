import {
    EditOutlined,
    MinusCircleOutlined,
    PlusOutlined,
    QuestionCircleOutlined,
    ReloadOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import { Duration, isArr } from '@mars/common';
import {
    Input,
    Switch,
    Card,
    Typography,
    Divider,
    Form,
    Space,
    Button,
    message,
    Select,
    InputProps,
    FormItemProps,
    Popover,
} from 'antd';
import Head from 'next/head';
import { createContext, useContext, useMemo, useState } from 'react';
import {
    BaseInputProps,
    DurationInput,
    SettingAcsolSelect,
    SettingIssueSelect,
} from '_comp/table/input.fields';
import { THeader } from '_comp/table/table.header';
import { useApp } from '_ctx/app.ctx';
import { usePage } from '_ctx/page.ctx';
import notif from '_service/notif';
import axios from 'axios';
import { BoolHook, useBool } from '_hook/util.hook';
import TextArea from 'antd/lib/input/TextArea';

const SUFFIX_DESC = ':description';
const SettingContext = createContext<map<DTO.Setting>>({});

export default function SettingPage() {
    const app = useApp();
    const page = usePage();
    const [form] = Form.useForm();

    const keyValuePair = (s: DTO.Setting) => {
        return [
            [s.key, deserialize(s)],
            [s.key + SUFFIX_DESC, s.description],
        ] as const;
    };

    const loaded = useMemo(() => Object.keys(app.settings).length > 0, [app.settings]);
    const raw = useMemo(
        () =>
            Object.fromEntries(
                Object.values(app.settings)
                    .flatMap((c) => c)
                    .map(
                        (c) =>
                            [
                                c.key,
                                {
                                    key: c.key,
                                    type: c.type,
                                    value: c.value,
                                    tag: c.tag,
                                    description: c.description,
                                } as DTO.Setting,
                            ] as const
                    )
            ),
        [app.settings]
    );
    const origin = useMemo(
        () =>
            Object.fromEntries(
                Object.keys(app.settings)
                    .flatMap((e) => app.settings[e])
                    .flatMap(keyValuePair)
            ),
        [app.settings]
    );

    const onSubmit = (values: map) => {
        // page.setLoading(true);
        const keys = Object.keys(values).filter((e) => !e.endsWith(SUFFIX_DESC));
        const configs: DTO.Setting[] = [];

        try {
            console.log('Remapping configs', keys);
            for (const key of keys) {
                const config = raw[key];
                console.log('Get Source Config (%s)', key, config);

                const value = values[key];
                // console.log('Get Edited Config', value);

                // console.log('Get Description Config');
                const description = values[key + SUFFIX_DESC];

                console.log('Mapping Config');
                const newConfig = {
                    key: config.key,
                    value: serialize(config, value),
                    type: config.type,
                    tag: config.tag,
                    description,
                };

                // console.log(key, newConfig);
                configs.push(newConfig);
            }

            console.log('Sending config updates');
            api.put('/app/config', configs)
                .then(() => message.success('configuration updated'))
                .catch(notif.axiosError)
                .finally(() => {
                    page.setLoading(false);
                    window.dispatchEvent(new Event('refresh-setting'));
                });
        } catch (ex) {
            console.error(ex);
            message.error(ex?.message || ex);
        }
    };

    console.log(origin);
    return (
        <div className="workspace settings">
            <Head>
                <title>Mars - Application Setting</title>
            </Head>
            <THeader
                title={
                    <>
                        <Typography.Title level={3}>Pengaturan Aplikasi</Typography.Title>
                        <Divider />
                    </>
                }
            />
            <SettingContext.Provider value={{ ...raw }}>
                {loaded && (
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={origin}
                        onFinish={onSubmit}
                    >
                        <Form.Item>
                            <Space align="baseline">
                                <Button
                                    type="default"
                                    htmlType="reset"
                                    icon={<ReloadOutlined />}
                                >
                                    Reset
                                </Button>
                                <Button
                                    htmlType="submit"
                                    type="primary"
                                    icon={<SaveOutlined />}
                                >
                                    Simpan
                                </Button>
                            </Space>
                        </Form.Item>
                        <div className="settings-tags">
                            <SettingTagApplication />
                            <SettingTagTelegram />
                            <SettingTagAccount />
                            {/* <SettingTagCredential /> */}
                        </div>
                    </Form>
                )}
            </SettingContext.Provider>
        </div>
    );
}

function deserialize(config: DTO.Setting) {
    const value = config.value;
    switch (config.type.enum) {
        case DTO.SettingType.BOOLEAN:
            return 't' === value.toLowerCase();
        case DTO.SettingType.INTEGER:
        case DTO.SettingType.LONG:
        case DTO.SettingType.DOUBLE:
        case DTO.SettingType.FLOAT:
        case DTO.SettingType.SHORT:
            return Number(value);
        case DTO.SettingType.DURATION:
            return Duration.from(value);
        case DTO.SettingType.LIST:
            return value.split('|').filter((e) => !!e);
    }
    return value;
}
function serialize(config: DTO.Setting, value: any) {
    switch (config.type.enum) {
        case DTO.SettingType.DURATION:
            return (value as Duration).toString();
        case DTO.SettingType.LIST:
            return (value as string[]).join('|');
        case DTO.SettingType.BOOLEAN:
            return value ? 't' : 'f';
        default:
            return String(value);
    }
}

// ----------------------------------------------------------------------------------------------------------------
// Interfaces
// ----------------------------------------------------------------------------------------------------------------
interface SettingCardProps extends HasChild {
    title?: string;
}
interface SettingFieldProps<T = any> extends Omit<FormItemProps<T>, 'name' | 'label'> {
    field: DTO.SettingKey;
    label: string;
    children: React.ReactElement<BaseInputProps>;
}

// ----------------------------------------------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------------------------------------------
function SCard(props: SettingCardProps) {
    return (
        <Card title={props.title} className="settings-value">
            {props.children}
        </Card>
    );
}

function SLabel(props: { field: DTO.SettingKey; editable?: BoolHook; children: string }) {
    // const app = useApp();

    const title = <Typography.Title level={5}>{props.children}</Typography.Title>;
    const description: string = Form.useWatch(props.field + SUFFIX_DESC);
    const editMode = props.editable?.value || false;

    const showIcon = useBool();
    const onHover = () => showIcon.setValue(true);
    const onLeave = () => showIcon.setValue(false);

    const onIconEditClicked = () => props.editable?.toggle();
    const editIcon = <EditOutlined onClick={onIconEditClicked} />;

    if (editMode || !description) {
        return (
            <Space align="center" onMouseOverCapture={onHover} onMouseLeave={onLeave}>
                {title}
                {/* <QuestionCircleOutlined /> */}
                {editMode || showIcon.value ? editIcon : null}
            </Space>
        );
    } else {
        const icon = showIcon.value ? editIcon : <QuestionCircleOutlined />;
        return (
            <Popover
                content={
                    <div style={{ width: 250 }}>
                        <Typography.Paragraph>{description}.</Typography.Paragraph>
                    </div>
                }
            >
                <Space align="center" onMouseOverCapture={onHover} onMouseLeave={onLeave}>
                    {title}
                    {editMode ? editIcon : icon}
                </Space>
            </Popover>
        );
    }
}

function SField(props: SettingFieldProps) {
    const { field, label, children, ...others } = props;
    const editDesc = useBool();

    const compLabel = (
        <SLabel field={field} editable={editDesc}>
            {label}
        </SLabel>
    );

    const type = children.type;
    const valuePropName = type === Switch ? 'checked' : 'value';
    return (
        <Form.Item label={compLabel}>
            <Form.Item name={field + SUFFIX_DESC} hidden={!editDesc.value}>
                <TextArea placeholder={`Edit deskripsi ${label}`} />
            </Form.Item>
            <Form.Item name={field} {...others} valuePropName={valuePropName} noStyle>
                {children}
            </Form.Item>
        </Form.Item>
    );
}

function SettingTagApplication() {
    // const app = useApp();
    // const form = Form.useFormInstance();

    const approvalEnabled: boolean = Form.useWatch(
        DTO.SettingKey.APP_USER_REGISTRATION_APPROVAL_BOOL
    );

    return (
        <SCard title="Aplikasi">
            {/* <Form form={form}> */}
            <SField
                label="Agent membuat tiket sendiri"
                field={DTO.SettingKey.APP_ALLOW_AGENT_CREATE_TICKET_BOOL}
            >
                <Switch size="default" checkedChildren="Ya" unCheckedChildren="Tidak" />
            </SField>
            <SField
                label="Persetujuan Registrasi"
                field={DTO.SettingKey.APP_USER_REGISTRATION_APPROVAL_BOOL}
            >
                <Switch size="default" checkedChildren="Ya" unCheckedChildren="Tidak" />
            </SField>
            <SField
                label="Durasi Persetujuan Registrasi"
                field={DTO.SettingKey.APP_USER_REGISTRATION_APPROVAL_DRT}
            >
                <DurationInput disabled={!approvalEnabled} />
            </SField>
            <SField
                label="Issue/Masalah yang tidak termasuk GaUl"
                field={DTO.SettingKey.APP_ISSUE_GAUL_EXCLUDE_LIST}
            >
                <SettingIssueSelect />
            </SField>
            <SField
                label="Solusi yang tidak termasuk hitungan performasi"
                field={DTO.SettingKey.APP_SOLUTION_REPORT_EXCLUDE_LIST}
            >
                <SettingAcsolSelect />
            </SField>
        </SCard>
    );
}
function SettingTagTelegram() {
    return (
        <SCard title="Telegram">
            <SField
                field={DTO.SettingKey.TG_START_CMD_ISSUE_COLUMN_INT}
                label="Jumlah Issue Command Telegram"
            >
                <Input type="number" min={0} max={5} />
            </SField>
            <SField field={DTO.SettingKey.TG_CONFIRMATION_DRT} label="Durasi Konfirmasi">
                <DurationInput />
            </SField>
            <SField
                field={DTO.SettingKey.TG_PENDING_CONFIRMATION_DRT}
                label="Durasi Konfirmasi Pending"
            >
                <DurationInput />
            </SField>
        </SCard>
    );
}
function SettingTagAccount() {
    const expiredEnabled: boolean = Form.useWatch(DTO.SettingKey.ACC_EXPIRED_BOOL);
    const editEmailListDesc = useBool();
    return (
        <SCard title="Akun">
            <SField label="Akun Kadaluarsa" field={DTO.SettingKey.ACC_EXPIRED_BOOL}>
                <Switch size="default" checkedChildren="Ya" unCheckedChildren="Tidak" />
            </SField>
            <SField
                label="Durasi Akun sebelum Kadaluarsa"
                field={DTO.SettingKey.ACC_EXPIRED_DRT}
            >
                <DurationInput disabled={!expiredEnabled} />
            </SField>
            <Form.Item
                className="settings-list-view"
                label={
                    <SLabel
                        field={DTO.SettingKey.ACC_REGISTRATION_EMAILS_LIST}
                        editable={editEmailListDesc}
                    >
                        Email registrasi
                    </SLabel>
                }
            >
                <Form.Item
                    name={DTO.SettingKey.ACC_REGISTRATION_EMAILS_LIST + SUFFIX_DESC}
                    hidden={!editEmailListDesc.value}
                >
                    <TextArea />
                </Form.Item>
                <Form.List name={DTO.SettingKey.ACC_REGISTRATION_EMAILS_LIST}>
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => {
                                return (
                                    <Form.Item
                                        key={key}
                                        noStyle
                                        className="settings-list-item"
                                    >
                                        <Space align="baseline">
                                            <Form.Item
                                                name={name}
                                                {...restField}
                                                validateTrigger={['onChange', 'onBlur']}
                                                rules={[
                                                    {
                                                        type: 'email',
                                                        required: true,
                                                        message:
                                                            'Email tidak boleh kosong',
                                                    },
                                                ]}
                                            >
                                                <Input
                                                    type="email"
                                                    placeholder="email"
                                                    allowClear
                                                />
                                            </Form.Item>
                                            <MinusCircleOutlined
                                                onClick={() => remove(name)}
                                            />
                                        </Space>
                                    </Form.Item>
                                );
                            })}
                            <Form.Item>
                                <Button
                                    type="dashed"
                                    icon={<PlusOutlined />}
                                    onClick={() => add()}
                                >
                                    Tambah Email
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>
            </Form.Item>
        </SCard>
    );
}
function SettingTagCredential() {
    const form = Form.useFormInstance();

    const randomSecret = async () => {
        const res = await axios.get<string>('/api/config/generate-secret');
        form.setFieldValue(DTO.SettingKey.CRD_PASSWORD_SECRET_STR, res.data);
    };

    const randomHashIteration = () => {
        const min = 10000;
        const max = 40000;
        const res = Math.floor(Math.random() * (max - min + 1) + min);
        form.setFieldValue(DTO.SettingKey.CRD_PASSWORD_HASH_ITERATION_INT, res);
    };

    return (
        <SCard title="Mandat">
            <SField
                field={DTO.SettingKey.CRD_PASSWORD_ALGO_STR}
                label="User Password Algoritma"
            >
                <Select
                    options={[
                        { label: 'BCrypt', value: 'bcrypt' },
                        { label: 'LDap', value: 'ldap' },
                        { label: 'PBKDF2 SHA256', value: 'pbkdf2-sha256' },
                        { label: 'PBKDF2 SHA1', value: 'pbkdf2-sha1' },
                        { label: 'PBKDF2 SHA512', value: 'pbkdf2-sha512' },
                        { label: 'SCrypt', value: 'scrypt' },
                    ]}
                />
            </SField>
            <SField
                field={DTO.SettingKey.CRD_PASSWORD_HASH_ITERATION_INT}
                label="User Password Hash Iteration"
            >
                <Input
                    type="number"
                    disabled
                    addonAfter={
                        <ReloadOutlined
                            title="Generate Random"
                            onClick={randomHashIteration}
                        />
                    }
                />
            </SField>
            <SField
                field={DTO.SettingKey.CRD_PASSWORD_SECRET_STR}
                label="User Password Secret"
            >
                <Input
                    disabled
                    addonAfter={
                        <ReloadOutlined title="Generate Random" onClick={randomSecret} />
                    }
                />
            </SField>
            <SField
                field={DTO.SettingKey.CRD_PASSWORD_HISTORY_INT}
                label="User Password History"
            >
                <Input type="number" min={0} />
            </SField>
        </SCard>
    );
}
