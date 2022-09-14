import { LoginOutlined } from "@ant-design/icons";
import { HttpHeader, isDefined, MimeType } from "@mars/common";
import { Button, Divider, Form, Input, message } from "antd";
import Layout from "antd/lib/layout/layout";
import { AxiosError, AxiosResponse } from "axios";
import { NextPageContext } from "next";
import { Session } from "next-auth";
import { getProviders, getSession, signIn } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { NextRouter, useRouter } from "next/router";
import { MarsIcon } from "_comp/logo/mars-roc";

function LoginPage(props: { session: Session; providers: NextAuthProviders }) {
    const router = useRouter();
    const callbackUrl = (router.query.callbackUrl as string) || "/";

    const logoDimension = 650;

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

async function login(
    router: NextRouter,
    { callbackUrl, nik, password }: LoginOpt,
    attempt = 1
) {
    const res = await signIn("mars-roc", {
        callbackUrl,
        redirect: false,
        nik,
        password,
    });

    console.log(res);
    if (res?.ok) await router.push(res.url);
    else {
        const msg = res.error;

        const [code, err] = msg.split(": ");
        switch (code) {
            case "AUTH-02":
                console.log("[INFO] User not linked, trying self-registration");
                const ok = await register(nik, password);
                if (attempt > 0 && ok) {
                    return await login(router, { callbackUrl, nik, password }, attempt - 1);
                }
                message.error(msg, 5);
                break;
            default:
                console.error("[ERR] Invalid user credential");
                message.error(msg, 5);
                break;
        }
    }
}

async function register(nik: string, password: string) {
    return await api
        .post("/user/register", { nik, password })
        .then((res) => {
            return true;
        })
        .catch((err: AxiosError) => {
            console.error(err);
            const res: AxiosResponse = err.response;
            if (res && isDefined(res.data)) {
                message.error(`${res.data.code}: ${res.data.message}`);
            } else {
                message.error(`AUTH-99 (${err.name}): ${err.message}`);
            }
            return false;
        });
}
