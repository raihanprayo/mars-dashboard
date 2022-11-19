import { OrderTable } from '_comp/table/order.table';

function IndexPage() {
    return <OrderTable url='/order/dashboard' customContextMenu />
}

export default IndexPage;
