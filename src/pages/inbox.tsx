import { OrderTable } from '_comp/table/order.table';

const url = '/order/inbox';
function InboxPage() {
    return <OrderTable url={url} withActionCol={false} withLinkToDetail />;
}
export default InboxPage;
