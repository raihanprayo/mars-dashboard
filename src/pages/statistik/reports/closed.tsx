import { Form, PageHeader } from 'antd';
import { NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { usePage } from '_ctx/page.ctx';
import { MarsTableProvider } from '_ctx/table.ctx';
import { usePageable } from '_hook/pageable.hook';
import { TicketPageMetadata, TicketTable } from '_comp/orders/ticket.table.view';

// export default function ReportClosedPage(props) {
//     const router = useRouter();
//     const page = usePage();

//     const { pageable } = usePageable();
//     const [filter] = Form.useForm<ICriteria<DTO.Ticket>>();

//     const refresh = useCallback(() => {
//         page.setLoading(true);
//         return router
//             .push({
//                 pathname: router.pathname,
//                 query: api.serializeParam({
//                     ...pageable,
//                     ...filter.getFieldsValue(),
//                     roles: {},
//                 }),
//             })
//             .finally(() => page.setLoading(false));
//     }, [pageable.page, pageable.size, pageable.sort, filter]);

//     return (
//         <MarsTableProvider refresh={refresh}>
//             <PageHeader title="Closed Ticket" onBack={() => router.back()} />
            
//         </MarsTableProvider>
//     );
// }

// export function getServerSideProps(ctx: NextPageContext) {
//     return {
//         props: {},
//     };
// }

export default function ReportClosedPage(props: TicketPageMetadata) {

    return <TicketTable metadata={props} />
}

export const getServerSideProps = TicketTable.getServerSideProps('/ticket', (params) => {
    return {
        filter: {
            ...params,
            status: {
                in: [Mars.Status.CLOSED]
            }
        }
    }
});