import { Mars } from "@mars/common/types/mars";
import {
    TicketPageMetadata,
    TicketTable,
} from "_comp/orders/ticket.table.view";
import { PageTitle } from "_utils/conversion";

function IndexPage(props: TicketPageMetadata) {
    if (props.error) {
        return <>Fail To get ticket</>;
    }

    return (
        <TicketTable
            metadata={props}
            customContextMenu
            withLinkToDetail
            withActionCol
        />
    );
}

export default PageTitle("Dashboard", IndexPage);

export const getServerSideProps = TicketTable.getServerSideProps("/ticket", {
    filter: {
        wip: { eq: false },
        status: { in: [Mars.Status.CLOSED], negated: true },
    },
});
