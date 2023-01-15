import axios from 'axios';
import { NextPageContext } from 'next';
import { getSession } from 'next-auth/react';
import { CoreService } from '_service/api';

export default function GroupPage(props: GroupPageProps) {
    return <></>;
}

export async function getServerSideProps(ctx: NextPageContext) {
    const session = await getSession();

    const { groupid, ...others } = ctx.query;
    const config = api.auhtHeader(session, {
        params: others,
    });

    const res = await api.manage(api.get<DTO.Group[]>(`/group/${groupid}`));
    if (axios.isAxiosError(res)) return api.serverSideError(res);

    return {
        groups: res.data,
    };
}

interface GroupPageProps extends CoreService.ErrorDTO {
    groups: DTO.Group[];
}
