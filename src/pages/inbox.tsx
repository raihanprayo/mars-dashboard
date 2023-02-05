import Head from 'next/head';
import { TicketPageMetadata, TicketTable } from '_comp/orders/ticket.table.view';
import { PageTitle } from '_utils/conversion';

function InboxPage(props: TicketPageMetadata) {
    return <PageTitle.Wrap title='Inbox'>
        <TicketTable metadata={props} inbox withActionCol={false} withLinkToDetail />
    </PageTitle.Wrap>
}
export default InboxPage;

export const getServerSideProps = TicketTable.getServerSideProps('/ticket/inbox');
