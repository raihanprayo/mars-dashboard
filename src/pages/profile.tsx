import { EditOutlined, SaveOutlined } from '@ant-design/icons';
import {
    Button,
    Card,
    Descriptions,
    Divider,
    Form,
    Input,
    message,
    Space,
    Tag,
    Typography,
} from 'antd';
import { Rule } from 'antd/lib/form/index';
import { NamePath } from 'antd/lib/form/interface';
import axios, { AxiosError } from 'axios';
import { NextPageContext } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ReactElement, useMemo, useState } from 'react';
import { FormRules } from '_comp/admin/rules';
import { MarsButton } from '_comp/base/Button';
import { PageContent } from '_comp/page/page';
import { Render } from '_comp/value-renderer';
import { usePage } from '_ctx/page.ctx';
import { useBool } from '_hook/util.hook';
import notif from '_service/notif';

export default function ProfilePage(props: ProfilePageProps) {
    const { error, user } = props;

    const router = useRouter();
    const page = usePage();
    const editMode = useBool();
    const [editForm] = Form.useForm<DTO.Whoami>();

    const [updatePassForm] = Form.useForm();
    const [updatePassLoading, setUpdatePassLoading] = useState(false);

    const ConfirmPassValidator: Rule = useMemo(
        () => ({
            validator(rule, value, callback) {
                const password = updatePassForm.getFieldValue('newPass');
                if (value !== password) callback('Password tidak sama');
            },
        }),
        []
    );
    const submitPasswordUpdate = async (value: any) => {
        setUpdatePassLoading(true);
        try {
            const { newPass, oldPass } = updatePassForm.getFieldsValue();

            try {
                await api.put('/user/password/' + user.id, {
                    newPass,
                    oldPass,
                });

                message.success("Update password berhasil")
            } catch (error) {
                const err: AxiosError = error;
                const res: any = err.response?.data;

                if (res) message.error(res.detail ?? res.message);
                else message.error(err.message);
            } finally {
                updatePassForm.resetFields();
            }
        } catch (err) {
            console.error(err);
        }
        setUpdatePassLoading(false);
    };
    const submitProfileUpdate = async () => {
        await editForm.validateFields();

        page.setLoading(true);
        api.put('/user/partial/' + user.id, editForm.getFieldsValue())
            .then((res) => message.success('Berhasil mengupdate profil'))
            .then(() => router.reload())
            .catch(notif.error.bind(notif))
            .finally(() => page.setLoading(false));
    };

    if (error) return <>{error.message}</>;

    const extra = (
        <Space align="baseline">
            {editMode.value && (
                <MarsButton
                    icon={<SaveOutlined />}
                    onClick={submitProfileUpdate}
                    loading={page.loading}
                >
                    Save
                </MarsButton>
            )}
            <MarsButton
                title="Edit Mode"
                icon={<EditOutlined />}
                onClick={() => {
                    if (editMode.value === true) editForm.resetFields();
                    editMode.toggle();
                }}
            >
                Edit
            </MarsButton>
        </Space>
    );

    const labelStyle = { width: 120 };
    const contentStyle = { width: 300 };

    return (
        <PageContent pageTitle="Profile">
            <Head>
                <title>Profile - {user.name}</title>
            </Head>

            <div className="workspace profile">
                <Card
                    title="Profile"
                    size="small"
                    extra={extra}
                    className="card-editable"
                    hoverable
                >
                    <Form
                        form={editForm}
                        initialValues={{
                            name: user.name,
                            email: user.email,
                            tg: { username: user.username },
                        }}
                    >
                        <Descriptions bordered size="small">
                            <Descriptions.Item
                                label="Name"
                                labelStyle={labelStyle}
                                contentStyle={contentStyle}
                            >
                                <EditableValue
                                    name="name"
                                    input={<Input />}
                                    edit={editMode.value}
                                >
                                    {user.name}
                                </EditableValue>
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="NIK"
                                labelStyle={labelStyle}
                                contentStyle={contentStyle}
                            >
                                {user.nik}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="Email"
                                labelStyle={labelStyle}
                                contentStyle={contentStyle}
                            >
                                <EditableValue
                                    name="email"
                                    input={<Input />}
                                    edit={editMode.value}
                                    rules={[
                                        {
                                            type: 'email',
                                            message: 'Invalid email format',
                                        },
                                    ]}
                                >
                                    {user.email}
                                </EditableValue>
                            </Descriptions.Item>

                            <Descriptions.Item
                                label="Witel"
                                labelStyle={labelStyle}
                                contentStyle={contentStyle}
                            >
                                {Render.witel(user.witel)}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="STO"
                                span={3}
                                labelStyle={labelStyle}
                                contentStyle={contentStyle}
                            >
                                {Render.tags({ bold: true, statusDisplay: true })(
                                    user.sto
                                )}
                            </Descriptions.Item>

                            <Descriptions.Item
                                label="Telegram"
                                labelStyle={labelStyle}
                                contentStyle={contentStyle}
                            >
                                {user.telegramId}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="Username"
                                span={3}
                                labelStyle={labelStyle}
                                contentStyle={contentStyle}
                            >
                                <EditableValue
                                    name={['tg', 'username']}
                                    input={<Input />}
                                    edit={editMode.value}
                                >
                                    {user.username}
                                </EditableValue>
                            </Descriptions.Item>

                            <Descriptions.Item
                                label="Role"
                                span={5}
                                labelStyle={labelStyle}
                                contentStyle={contentStyle}
                            >
                                {user.roles.map((role, i) => (
                                    <Tag key={`${role}-${i}`}>
                                        <b>{role.toUpperCase()}</b>
                                    </Tag>
                                ))}
                            </Descriptions.Item>
                        </Descriptions>
                    </Form>
                </Card>
                <br />
                <Card size="small">
                    <Card.Grid>
                        <Typography.Title level={5}>Update Password</Typography.Title>
                        <Divider />
                        <Form
                            form={updatePassForm}
                            layout="vertical"
                            style={{ padding: '0 2rem' }}
                            size="small"
                            // onFinish={submitPasswordUpdate}
                        >
                            <Form.Item
                                label="Password Baru"
                                name="newPass"
                                colon
                                rules={[FormRules.REQUIRED]}
                            >
                                <Input.Password />
                            </Form.Item>
                            <Form.Item
                                label="Konfirmasi Password Baru"
                                name="confirmNewPass"
                                colon
                                rules={[
                                    ConfirmPassValidator,
                                    {
                                        required: true,
                                        message: 'Konfirmasi password tidak boleh kosong',
                                    },
                                ]}
                            >
                                <Input.Password />
                            </Form.Item>
                            <Form.Item
                                label="Password Lama"
                                name="oldPass"
                                colon
                                rules={[FormRules.REQUIRED]}
                            >
                                <Input.Password />
                            </Form.Item>
                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="middle"
                                    loading={updatePassLoading}
                                    onClick={submitPasswordUpdate}
                                >
                                    Update
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card.Grid>
                </Card>
            </div>
        </PageContent>
    );
}
interface ProfilePageProps {
    user: DTO.Whoami;
    error?: {
        status: number;
        title?: string;
        message: string;
    };
}

export async function getServerSideProps(ctx: NextPageContext) {
    const session = await getSession(ctx);
    const config = api.auhtHeader(session);

    const res = await api.get('/auth/whoami', config).catch((err) => err);
    if (!axios.isAxiosError(res)) {
        return {
            props: { user: res.data },
        };
    }

    const data: any = res.response?.data;
    return {
        props: {
            error: {
                status: data?.status ?? res.status,
                title: data?.title ?? res.code,
                message: data?.detail ?? data?.message ?? res.message,
            },
        },
    };
}

// Context --------------------------------------------------------------------
// const InfoProfileContext = createContext<InfoProfileContext>(null);
// interface InfoProfileContext {
//     edit: boolean;
//     form: FormInstance<DTO.Whoami>;
// }

// Value Editable -------------------------------------------------------------
function EditableValue(props: EditableValueProps) {
    const { edit } = props;

    const InputElm = props.input.type;
    const InputProps = { ...props.input.props, size: 'small' };
    return (
        <>
            {!edit && props.children}
            {edit && (
                <Form.Item name={props.name} rules={props.rules}>
                    {<InputElm {...InputProps} />}
                </Form.Item>
            )}
        </>
    );
}
interface EditableValueProps extends HasChild {
    name: NamePath;
    input: ReactElement;
    edit: boolean;
    rules?: Rule[];
}
