import { useBool } from '_hook/util.hook';
import notif from '_service/notif';
import { Button, Card, Form, Input, Layout, message } from 'antd';
import { Rule } from 'antd/lib/form';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { ForgotLayout } from '.';
import { NextPageContext } from 'next';

function ForgotResetPassword() {
    const [form] = Form.useForm();
    const router = useRouter();
    const loading = useBool();

    const ConfirmPassValidator: Rule = useMemo(
        () => ({
            validator(rule, value, callback) {
                const password = form.getFieldValue('password');
                if (value !== password) callback('Password not match');
            },
        }),
        []
    );

    const onFinish = () => {
        loading.setValue(true);
        const v = form.getFieldsValue();
        api.put('/auth/forgot/reset', {
            newPassword: v.password,
            token: v.token,
        })
            .then((res) => {
                if (res.data.next === 'DONE') {
                    message.success('Password berhasil direset');
                    window.location.href = '/auth/login';
                }
            })
            .catch(notif.axiosError)
            .finally(() => loading.setValue(false));
    };

    return (
        <ForgotLayout>
            <Card>
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ token: router.query.token }}
                >
                    <Form.Item name="token" hidden>
                        <Input disabled />
                    </Form.Item>

                    <Form.Item label="Password" name="password" required>
                        <Input.Password placeholder="Password" />
                    </Form.Item>

                    <Form.Item
                        label="Konfirmasi Password"
                        name="confirm-password"
                        rules={[ConfirmPassValidator]}
                        required
                    >
                        <Input.Password placeholder="konfirmasi password" />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading.value}
                            onClick={onFinish}
                        >
                            Reset
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </ForgotLayout>
    );
}
namespace ForgotResetPassword {
    export interface Props {
        error?: {
            message: string;
        }
    }

    export function getInitialProps(ctx: NextPageContext) {
        return {}
    }
}

export default ForgotResetPassword;