import { OrderTable } from '_comp/orders/order-table.view';

function IndexPage() {
    return <OrderTable url='/order/dashboard' customContextMenu />
}

export default IndexPage;
