import { TicketPageMetadata, TicketTable } from '_comp/orders/ticket.table.view';

function InboxPage(props: TicketPageMetadata) {
    return <TicketTable metadata={props} inbox withActionCol={false} withLinkToDetail />;
}
export default InboxPage;

export const getServerSideProps = TicketTable.getServerSideProps('/ticket/inbox');
