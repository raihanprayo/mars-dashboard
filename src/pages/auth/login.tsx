import { LoginOutlined } from "@ant-design/icons";
import { Button, Divider, Form, Input, message } from "antd";
import Layout from "antd/lib/layout/layout";
import { NextPageContext } from "next";
import { Session } from "next-auth";
import { getProviders, getSession, signIn } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { NextRouter, useRouter } from "next/router";
import { MarsIcon } from "_comp/logo/mars-roc";

function LoginPage(props: { session: Session; providers: NextAuthProviders }) {
    const { session, providers } = props;
    const router = useRouter();
    const callbackUrl = (router.query.callbackUrl as string) || "/";

    const logoDimension = 650;
    const provider = providers["mars-roc"];

    return (
        <Layout className="login-container">
            <Head>
                <title>Mars ROC login</title>
            </Head>

            <div className="login-forms">
                <div className="login-forms-header text-center">
                    <Link href="/auth/login">
                        <a>
                            <LoginOutlined />
                            <h1>Login</h1>
                        </a>
                    </Link>
                    <h5 className="motto text-muted">
                        <b>M</b>anpower <b>A</b>dministration and <b>R</b>ating <b>S</b>ystem
                    </h5>
                </div>

                <Form
                    className="login-forms-content"
                    layout="vertical"
                    onFinish={(v) => login(router, { callbackUrl, ...v })}
                >
                    <Form.Item name="nik">
                        <Input type="text" placeholder="nik" />
                    </Form.Item>
                    <Form.Item name="password">
                        <Input.Password placeholder="password" />
                    </Form.Item>

                    <Form.Item className="submit-container">
                        <Button type="link" className="register-btn">
                            <Link href="/auth/register">
                                <b>register</b>
                            </Link>
                        </Button>
                        <Button type="primary" htmlType="submit" className="right">
                            <b>Login</b>
                        </Button>
                    </Form.Item>
                </Form>
            </div>
            <div className="login-logo">
                <MarsIcon style={{ width: logoDimension, height: logoDimension }} />
            </div>
        </Layout>
    );
}

LoginPage.getInitialProps = async function (ctx: NextPageContext) {
    const providers = await getProviders();
    const session = await getSession(ctx);

    return { session, providers };
};

export default LoginPage;

type NextAuthProviders = ReturnType<typeof getProviders> extends Promise<infer P> ? P : never;
interface LoginOpt {
    nik: string;
    password: string;
    callbackUrl: string;
}

async function login(router: NextRouter, { callbackUrl, nik, password }: LoginOpt) {
    const res = await signIn("mars-roc", {
        callbackUrl,
        redirect: false,
        nik,
        password,
    });

    console.log(res);
    if (res?.ok) await router.push(res.url);
    else message.error(res?.error, 5);

    // fetch('/api/auth/callback/credentials').then(res => {

    // })
}
