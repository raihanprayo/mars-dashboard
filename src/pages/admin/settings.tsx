import {
    MinusCircleOutlined,
    PlusOutlined,
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
} from 'antd';
import Head from 'next/head';
import { useMemo } from 'react';
import { DurationInput } from '_comp/table/input.fields';
import { THeader } from '_comp/table/table.header';
import { useApp } from '_ctx/app.ctx';
import { usePage } from '_ctx/page.ctx';
import notif from '_service/notif';

export default function SettingPage() {
    console.log(api.defaults);

    const app = useApp();
    const page = usePage();
    const [form] = Form.useForm();

    const keyValuePair = (s: DTO.Setting) => {
        return [s.key, deserialize(s)] as const;
    };

    const origin = useMemo(
        () =>
            Object.fromEntries(
                Object.keys(app.settings)
                    .flatMap((e) => app.settings[e])
                    .map(keyValuePair)
            ),
        [app.settings]
    );

    const onSubmit = (values: map) => {
        page.setLoading(true);
        const raw = Object.fromEntries(
            Object.values(app.settings)
                .flatMap((e) => e)
                .map((e) => [e.key, e] as const)
        );

        const configs: DTO.Setting[] = [];
        for (const key in values) {
            const config = raw[key];
            const value = values[key];

            configs.push({
                key: config.key,
                value: serialize(config, value),
                type: config.type,
                tag: config.tag,
            });
        }

        api.put('/app/config', configs)
            .then(() => message.success('configuration updated'))
            .catch(notif.axiosError)
            .finally(() => {
                page.setLoading(false);
                window.dispatchEvent(new Event('refresh-setting'));
            });
    };

    return (
        <div className="workspace settings">
            <Head>
                <title>Mars - Application Setting</title>
            </Head>
            <THeader
                title={
                    <>
                        <Typography.Title level={3}>Setting Aplikasi</Typography.Title>
                        <Divider />
                    </>
                }
            />
            <Form
                form={form}
                layout="vertical"
                initialValues={origin}
                onFinish={onSubmit}
            >
                <Form.Item>
                    <Space align="baseline">
                        <Button type="default" htmlType="reset" icon={<ReloadOutlined />}>
                            Reset
                        </Button>
                        <Button htmlType="submit" type="primary" icon={<SaveOutlined />}>
                            Simpan
                        </Button>
                    </Space>
                </Form.Item>
                <div className="settings-tags">
                    <SettingTagApplication />
                    <SettingTagAccount />
                    <SettingTagTelegram />
                    {/* <SettingTagCredential /> */}
                </div>
            </Form>
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

function Setting(props: HasChild) {
    return <Card className="settings-value">{props.children}</Card>;
}

function SettingTagApplication() {
    // const app = useApp();
    // const form = Form.useFormInstance();
    return (
        <Card className="settings-value">
            {/* <Form form={form}> */}
            <Form.Item
                label="Agent membuat tiket sendiri"
                name="agent-allowed-to-create-ticket"
                extra="Agent diperbolehkan membuat tiket sendiri"
            >
                <Switch size="default" checkedChildren="Ya" unCheckedChildren="Tidak" />
            </Form.Item>
            <Form.Item
                label="Persetujuan Registrasi"
                name="user-registration-approval"
                extra="Registrasi diperlukan persetujuan dari admin"
            >
                <Switch size="default" checkedChildren="Ya" unCheckedChildren="Tidak" />
            </Form.Item>
            <Form.Item
                label="Registrasi Durasi Persetujuan"
                name="user-registration-approval-duration"
            >
                <DurationInput />
            </Form.Item>
            <Form.Item label="Durasi Konfirmasi" name="confirmation-duration">
                <DurationInput />
            </Form.Item>
            <Form.Item
                label="Durasi Konfirmasi Pending"
                name="confirmation-pending-duration"
            >
                <DurationInput />
            </Form.Item>
            {/* </Form> */}
        </Card>
    );
}
function SettingTagAccount() {
    return (
        <Card className="settings-value">
            <Form.Item label="Akun Kadaluarsa" name="account-expireable">
                <Switch size="default" checkedChildren="Ya" unCheckedChildren="Tidak" />
            </Form.Item>
            <Form.Item
                label="Durasi Akun sebelum Kadaluarsa"
                name="account-expired-duration"
            >
                <DurationInput />
            </Form.Item>
            <Form.Item
                className="settings-list-view"
                label="Email yang ditampilkan saat registrasi"
            >
                <Form.List name="account-registration-approval-email">
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
        </Card>
    );
}
function SettingTagTelegram() {
    // TG_START_CMD_ISSUE_COLUMN_INT = "tg-stat-command-issue-col-count";
    return (
        <Setting>
            <Form.Item
                label="Jumlah Issue Command Telegram"
                name="tg-stat-command-issue-col-count"
                extra="Jumlah kolom perbaris pada command /start"
            >
                <Input type="number" min={0} max={5} />
            </Form.Item>
        </Setting>
    );
}
function SettingTagCredential() {
    // CRD_DEFAULT_PASSWORD_ALGO_STR = "password-algo",
    // CRD_DEFAULT_PASSWORD_SECRET_STR = "password-secret",
    // CRD_DEFAULT_PASSWORD_ITERATION_INT = "password-hash-iteration";

    //     bcrypt
    // ldap
    // pbkdf2
    // scrypt
    return (
        <Card className="settings-value">
            <Form.Item label="Password Algoritma" name="password-algo">
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
            </Form.Item>
        </Card>
    );
}
