import { AuditOutlined, BugOutlined } from "@ant-design/icons";
import { isDefined } from "@mars/common";
import { CopyToClipboard } from "_comp/base";
import { TFilter, THeader } from "_comp/table";
import { Render } from "_comp/value-renderer";
import { useBool } from "_hook/util.hook";
import { CoreService } from "_service/api";
import { Card, Descriptions, Space, Typography } from "antd";
import axios from "axios";
import { NextPageContext } from "next";
import { getSession } from "next-auth/react";
import Head from "next/head";

export default function IssueDetailPage(props: IssueDetailPageProps) {
    const issue = props.isu;
    const edit = useBool();

    console.log(issue);
    if (props.error) return <>{props.error.message}</>;
    return (
        <div className="tc-detail-container">
            <Head>
                <title>Mars - Detail isu {issue.name.toUpperCase()}</title>
            </Head>
            <div className="tc-detail-content">
                <Descriptions
                    bordered
                    size="small"
                    title={
                        <Typography.Title level={3}>
                            <BugOutlined className="tc-desc-title-icon" />
                            <span className="tc-desc-title">
                                Isu - {issue.name.toUpperCase()}
                            </span>
                        </Typography.Title>
                    }
                    layout="vertical"
                >
                    <Descriptions.Item label="Code" span={2}>
                        <b>{issue.name}</b>
                    </Descriptions.Item>
                    <Descriptions.Item label="Nama Yang Ditampilkan">
                        {issue.alias || <i>* kosong</i>}
                    </Descriptions.Item>
                    <Descriptions.Item label="Skor" span={2}>
                        {issue.score}
                    </Descriptions.Item>
                    <Descriptions.Item label="Produk">
                        {Render.product(issue.product)}
                    </Descriptions.Item>
                </Descriptions>
            </div>
            <div className="tc-detail-info"></div>
        </div>
    );
}

interface IssueDetailPageProps extends CoreService.ErrorDTO {
    isu: DTO.Issue;
}

export async function getServerSideProps(
    ctx: NextPageContext
): NextServerSidePropsAsync<any> {
    const isuId = ctx.query.id;
    const session = await getSession(ctx);

    if (!isDefined(session)) {
        return {
            props: {
                error: {
                    status: 401,
                    title: "Unauthorized",
                    detail: "Full authentication required to access this resource",
                },
            },
        };
    } else {
        const config = api.auhtHeader(session);
        const res = await api.manage(api.get("/issue/" + isuId, config));

        if (axios.isAxiosError(res)) return api.serverSideError(res);
        return {
            props: {
                isu: res.data,
            },
        };
    }
}
