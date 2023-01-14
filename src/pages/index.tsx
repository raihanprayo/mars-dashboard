import { TicketTable } from '_comp/orders/ticket.table.view';

function IndexPage() {
    return (
        <TicketTable
            url="/ticket"
            customContextMenu
            withLinkToDetail
            defaultFilter={{
                status: {
                    in: [
                        Mars.Status.OPEN,
                        Mars.Status.CONFIRMATION,
                        Mars.Status.DISPATCH,
                        Mars.Status.REOPEN,
                        Mars.Status.PENDING,
                    ] as any,
                },
            }}
        />
    );
}

export default IndexPage;
