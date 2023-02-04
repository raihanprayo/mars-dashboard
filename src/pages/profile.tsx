import {
    Button,
    Card,
    Col,
    Descriptions,
    Divider,
    Form,
    Input,
    message,
    Row,
    Tag,
    Typography,
} from 'antd';
import { Rule } from 'antd/lib/form/index';
import axios, { AxiosError } from 'axios';
import { NextPageContext } from 'next';
import { getSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { FormRules } from '_comp/admin/rules';
import { PageContent } from '_comp/page/page';

export default function ProfilePage(props: ProfilePageProps) {
    const { error, user } = props;

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

    if (error) return <>{error.message}</>;

    return (
        <PageContent pageTitle="Profile">
            <div className="workspace profile">
                <Card title="Profile" size="small">
                    <Form>
                        <Descriptions bordered size="small">
                            <Descriptions.Item label="Name" span={5}>
                                {user.name}
                            </Descriptions.Item>
                            <Descriptions.Item label="NIK" span={5}>
                                {user.nik}
                            </Descriptions.Item>
                            <Descriptions.Item label="Witel">
                                {user.witel}
                            </Descriptions.Item>
                            <Descriptions.Item label="STO" span={3}>
                                {user.sto || '-'}
                            </Descriptions.Item>

                            <Descriptions.Item label="Telegram">
                                {user.telegramId}
                            </Descriptions.Item>
                            <Descriptions.Item label="Username" span={3}>
                                {user.username}
                            </Descriptions.Item>
                            <Descriptions.Item label="Role">
                                {user.roles.map((role) => (
                                    <Tag>
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

interface ProfilePageProps {
    user: DTO.Whoami;
    error?: {
        status: number;
        title?: string;
        message: string;
    };
}
