import { TicketPageMetadata, TicketTable } from '_comp/orders/ticket.table.view';

function IndexPage(props: TicketPageMetadata) {
    if (props.error) {
        return <>Fail To get ticket datas</>;
    }

    return (
        <TicketTable
            metadata={props}
            customContextMenu
            editorDrawer
            withLinkToDetail
        />
    );
}

export default IndexPage;

export const getServerSideProps = TicketTable.getServerSideProps('/ticket', {
    filter: {
        status: {
            in: [
                Mars.Status.OPEN,
                Mars.Status.CONFIRMATION,
                Mars.Status.DISPATCH,
                Mars.Status.REOPEN,
                Mars.Status.PENDING,
            ] as any,
        },
    },
});
// export async function getServerSideProps(ctx: NextPageContext) {
//     const session = await getSession(ctx);
//     const config = api.auhtHeader(session);

//     const res = await api.manage<DTO.Ticket[]>(api.get('/ticket'));
//     if (axios.isAxiosError(res)) {
//         return api.serverSideError(res, res.response?.status);
//     }

//     const countHeader = (res.headers['tc-count'] || '').split(', ');
//     const total = res.headers[HttpHeader.X_TOTAL_COUNT] || res.data.length;

//     return {
//         props: {
//             data: res.data,
//             total,
//             products: {
//                 [Mars.Product.INTERNET]: Number(countHeader[0] || 0),
//                 [Mars.Product.IPTV]: Number(countHeader[1] || 0),
//                 [Mars.Product.VOICE]: Number(countHeader[2] || 0),
//             },
//         },
//     };
// }
