import { LoginOutlined } from '@ant-design/icons';
import { HttpHeader, isDefined, MimeType } from '@mars/common';
import { Button, Divider, Form, FormInstance, Input, message, Modal } from 'antd';
import { Rule } from 'antd/lib/form';
import Layout from 'antd/lib/layout/layout';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { NextPageContext } from 'next';
import { Session } from 'next-auth';
import { getProviders, getSession, signIn } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { NextRouter, useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MarsIcon } from '_comp/logo/mars-roc';

const EMAIL_PATTERN = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/i;

function LoginPage(props: { session: Session; providers: NextAuthProviders }) {
    const router = useRouter();
    const callbackUrl = (router.query.callbackUrl as string) || '/';

    const [loginForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [openPasswordConfirmation, setOpenPasswordConfirmation] = useState(false);

    const logoDimension = 650;

    return (
        <Layout className="login-container">
            <Head>
                <title>Mars ROC login</title>
            </Head>

            <div className="login-forms">
                <div className="login-forms-header text-center">
                    <Link href="/auth/login">
                        <LoginOutlined />
                        <h1>Login</h1>
                    </Link>
                    <h5 className="motto text-muted">
                        <b>M</b>anpower <b>A</b>dministration and <b>R</b>ating <b>S</b>
                        ystem
                    </h5>
                </div>

                <Form
                    form={loginForm}
                    className="login-forms-content"
                    layout="vertical"
                    onFinish={async (v) => {
                        setLoading(true);
                        try {
                            await login(
                                router,
                                { callbackUrl, ...v },
                                setOpenPasswordConfirmation
                            );
                        } finally {
                            setLoading(false);
                        }
                    }}
                >
                    <Form.Item name="nik">
                        <Input type="text" placeholder="nik" />
                    </Form.Item>
                    <Form.Item name="password">
                        <Input.Password placeholder="password" />
                    </Form.Item>

                    <Form.Item className="submit-container">
                        {/* <Button type="link" className="register-btn">
                            <Link href="/auth/register">
                                <b>register</b>
                            </Link>
                        </Button> */}
                        <Button type="primary" htmlType="submit" className="right">
                            <b>Login</b>
                        </Button>
                    </Form.Item>
                </Form>
            </div>
            <div className="login-logo">
                <MarsIcon style={{ width: logoDimension, height: logoDimension }} />
            </div>

            <ConfirmPassword
                form={loginForm}
                callbackUrl={callbackUrl}
                open={openPasswordConfirmation}
                setOpen={setOpenPasswordConfirmation}
                loading={loading}
                setLoading={setLoading}
            />
        </Layout>
    );
}

function ConfirmPassword(props: ConfirmPasswordProps) {
    const router = useRouter();
    const [formRef] = Form.useForm();
    const [emailHelp, setEmailHelp] = useState({
        default: 'Your Email (Optional)',
        error: '',
    });

    const EmailValidator: Rule = useMemo(
        () => ({
            required: false,
            max: 100,
            validator(rule, value, callback) {
                if (!value) {
                    setEmailHelp({ ...emailHelp, error: '' });
                    return;
                }

                if (value && (value as string).length > (rule.max || 0)) {
                    setEmailHelp({
                        ...emailHelp,
                        error: `only accept ${rule.max} character(s)`,
                    });
                    return;
                }

                const result = EMAIL_PATTERN.test(value);
                if (!result) {
                    const error = 'invalid email pattern';
                    setEmailHelp({ ...emailHelp, error });
                    callback(error);
                } else setEmailHelp({ ...emailHelp, error: '' });
            },
        }),
        []
    );
    const ConfirmPassValidator: Rule = useMemo(
        () => ({
            validator(rule, value, callback) {
                const password = props.form.getFieldValue('password');
                if (value !== password) callback('Password not match');
            },
        }),
        []
    );

    const InternalLogin = () => {
        console.log('Sending Confirmation');
        const values = formRef.getFieldsValue();
        props.setLoading(true);
        login(router, { ...values, confirmed: true, callbackUrl: props.callbackUrl })
            .then(() => {
                props.setOpen(false);
            })
            .finally(() => {
                props.setLoading(false);
            });
    };
    
    useEffect(() => {
        
    }, [])

    return (
        <Modal
            title="Credential Confirmation"
            open={props.open}
            destroyOnClose
            footer={[
                <Button
                    key={'modal-btn-cancel'}
                    type="default"
                    onClick={() => props.setOpen(false)}
                >
                    <b>Cancel</b>
                </Button>,
                <Button
                    key={'modal-btn-submit'}
                    type="primary"
                    loading={props.loading}
                    onClick={InternalLogin}
                >
                    <b>Submit</b>
                </Button>,
            ]}
            onCancel={() => props.setOpen(false)}
        >
            <Form form={formRef} layout="vertical">
                <Form.Item
                    label="NIK"
                    name="nik"
                    initialValue={props.form.getFieldValue('nik')}
                >
                    <Input type="text" disabled placeholder="nik" />
                </Form.Item>
                <Form.Item
                    label="Password"
                    name="password"
                    initialValue={props.form.getFieldValue('password')}
                >
                    <Input.Password disabled placeholder="password" />
                </Form.Item>
                <Form.Item
                    label="Konfirmasi Password"
                    name="confirm-password"
                    required
                    rules={[ConfirmPassValidator]}
                >
                    <Input.Password placeholder="retype your password" />
                </Form.Item>
                <Form.Item
                    label="Email"
                    name="email"
                    help={emailHelp.error || emailHelp.default}
                    rules={[EmailValidator]}
                >
                    <Input placeholder="email" />
                </Form.Item>
            </Form>
        </Modal>
    );
}
interface ConfirmPasswordProps {
    form: FormInstance;
    callbackUrl: string;

    open: boolean;
    setOpen(open: boolean): void;

    loading: boolean;
    setLoading(loading: boolean): void;
}

LoginPage.getInitialProps = async function (ctx: NextPageContext) {
    const providers = await getProviders();
    const session = await getSession(ctx);

    return { session, providers };
};

export default LoginPage;

type NextAuthProviders = ReturnType<typeof getProviders> extends Promise<infer P>
    ? P
    : never;
interface LoginOpt {
    nik: string;
    password: string;
    callbackUrl: string;

    username?: string;
    email?: string;
    confirmed?: boolean;
}

async function login(
    router: NextRouter,
    login: LoginOpt,
    openPasswordConfirmation?: (open: boolean) => void
) {
    const res: AxiosResponse<any> = await api
        .post('/auth/token', login, {
            withCredentials: true,
        })
        .catch((err) => err);

    if (axios.isAxiosError(res)) {
        if (res.response?.status === 400) {
            const data: any = res.response.data;
            if (data.code === 'confirm-password') openPasswordConfirmation?.(true);
            else message.error(data.message, 5);
        } else {
            const data: any = res.response?.data;
            if (data) message.error(data.message || data.detail, 5);
            else message.error(`[${res.code}] ${res.message}`);
        }
    } else {
        await signIn('mars-roc', {
            callbackUrl: login.callbackUrl,
            redirect: true,
            token: res.data.accessToken,
            refreshToken: res.data.refreshToken,
        }).catch((err) => {
            console.error(err);
            if (err instanceof Error) message.error(`[${err.name}] - ${err.message}`, 5);
            else message.error(typeof err == 'object' ? err?.message : 'Unknown', 5);
        });
    }
}
