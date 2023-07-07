import { useBool } from '_hook/util.hook';
import notif from '_service/notif';
import { Button, Form, Input, Layout } from 'antd';
import { Rule } from 'antd/lib/form';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { ForgotLayout } from '.';

export default function ForgotResetPassword() {
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

    const onFinish = (v: any) => {
        loading.setValue(true);
        api.put('/auth/forgot/reset', {
            newPassword: v.password,
            token: v.token,
        })
            .then((res) => {})
            .catch(notif.axiosError)
            .finally(() => loading.setValue(false));
    };

    return (
        <ForgotLayout>
            <Form
                form={form}
                layout="vertical"
                initialValues={{ token: router.query.token }}
                onFinish={onFinish}
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
                    <Button type="primary" htmlType="submit" loading={loading.value}>
                        Submit
                    </Button>
                </Form.Item>
            </Form>
        </ForgotLayout>
    );
}
