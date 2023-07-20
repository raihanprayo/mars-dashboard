import { HttpHeader } from '@mars/common';
import { THeader } from '_comp/table';
import { usePage } from '_ctx/page.ctx';
import { MarsTableProvider } from '_ctx/table.ctx';
import { usePageable } from '_hook/pageable.hook';
import { CoreService } from '_service/api';
import { getServerSidePropsWrapper } from '_utils/fns/get-server-side-props';
import { Form, Table } from 'antd';
import axios from 'axios';
import { NextPageContext } from 'next';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function UserEventPage(props: UserEventPageProps) {
    const page = usePage();
    const router = useRouter();
    const { pageable, setPageable } = usePageable();

    const [filter] = Form.useForm();

    const refresh = () => {
        return router.push({
            pathname: router.pathname,
            query: api.serializeParam({
                page: pageable.page,
                size: pageable.size,
                sort: pageable.sort === Pageable.Sorts.UNSORT ? undefined : pageable.sort,
                ...filter.getFieldsValue(),
            }),
        });
    };

    if (props.error) return <>{props.error.message}</>;

    return (
        <MarsTableProvider refresh={() => {}}>
            <div className="workspace table-view">
                <THeader></THeader>
                <Table 
                size='small'
                dataSource={props.data}>

                </Table>
            </div>
        </MarsTableProvider>
    );
}

export const getServerSideProps = getServerSidePropsWrapper(
    async (ctx, session, config) => {
        const res = await api.manage(api.get('/user/event', config));
        if (axios.isAxiosError(res)) return api.serverSideError(res);
        const total = res.headers[HttpHeader.X_TOTAL_COUNT] || res.data.length;
        return {
            props: {
                total,
                data: res.data.map((e) => {
                    e['key'] = e.id;
                    return e;
                }),
            },
        };
    }
);

interface UserEventPageProps extends CoreService.ErrorDTO {
    total: number;
    data: any[];
}
