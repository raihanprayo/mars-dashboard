import { TicketPageMetadata, TicketTable } from '_comp/orders/ticket.table.view';
import { PageTitle } from '_utils/conversion';

function IndexPage(props: TicketPageMetadata) {
    if (props.error) {
        return <>Fail To get ticket datas</>;
    }

    return (
        <TicketTable metadata={props} customContextMenu editorDrawer withLinkToDetail />
    );
}

export default PageTitle('Dashboard', IndexPage);

export const getServerSideProps = TicketTable.getServerSideProps('/ticket', {
    filter: {
        status: {
            in: [
                Mars.Status.OPEN,
                Mars.Status.CONFIRMATION,
                Mars.Status.DISPATCH,
                Mars.Status.REOPEN,
                Mars.Status.PENDING,
            ],
        },
    },
});
