import { OrderTable } from '_comp/table/table.ticket';

const url = '/order/inbox';
function InboxPage() {
    return <OrderTable url={url} withActionCol={false} withLinkToDetail />;
}
export default InboxPage;
