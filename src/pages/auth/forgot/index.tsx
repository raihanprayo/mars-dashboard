import { useBool } from '_hook/util.hook';
import notif from '_service/notif';
import { Button, Form, Input, Layout, Typography, message } from 'antd';
import Paragraph from 'antd/lib/skeleton/Paragraph';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function ForgotIndex() {
    const [form] = Form.useForm();
    const route = useRouter();
    const loading = useBool();

    const send = async (v: any) => {
        loading.setValue(true);
        const username = v.username;

        api.get('/auth/forgot', { params: { u: username } })
            .then(({ data }) => {
                if (data.telegram) {
                    route.push(`${route.pathname}/confirm?u=${username}`);
                } else {
                    message.error(
                        'Akun tersebut tidak ada atau tidak terintegrasi dengan akun telegram'
                    );
                }
            })
            .catch(notif.axiosError)
            .finally(() => loading.setValue(false));
    };

    return (
        <ForgotLayout>
            <Form
                form={form}
                className="forgot-password-form"
                layout="vertical"
                onFinish={send}
            >
                <Typography>
                    <Typography.Paragraph>Silahkan masukkan NIK akun yang akan direset</Typography.Paragraph>
                </Typography>

                <Form.Item
                    name="username"
                    label="NIK"
                    rules={[
                        { required: true, message: 'nama pencarian tidak boleh kosong' },
                    ]}
                >
                    <Input placeholder="nik" required />
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

export function ForgotLayout(props: HasChild) {
    return (
        <Layout className="forgot-container">
            <Head>
                <title>Mars ROC - Forgot Password</title>
            </Head>
            {props.children}
        </Layout>
    );
}
