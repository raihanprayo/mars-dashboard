import axios from 'axios';
import { NextPageContext } from 'next';
import { getSession } from 'next-auth/react';

export default function ProfilePage(props: ProfilePageProps) {
    const { error, user } = props;

    if (error) {
        return <>{error.message}</>;
    }
    return <>{user.name}</>;
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
                title: data?.title,
                message: data?.detail ?? data?.message,
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
