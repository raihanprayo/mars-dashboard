import { TicketTable } from '_comp/orders/ticket.table.view';

const url = '/order/inbox';
function InboxPage() {
    return <TicketTable url='/ticket/inbox' inbox withActionCol={false} withLinkToDetail />;
}
export default InboxPage;
