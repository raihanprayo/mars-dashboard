import { useContext, useEffect } from "react";
import TableTicket from "_comp/table/table.ticket";
import { PageContext } from "_ctx/page.ctx";

function InboxPage() {
    const ctx = useContext(PageContext);

    useEffect(() => {
        if (!ctx.collapsed) ctx.setCollapse(true);
    }, []);

    return <TableTicket inbox />;
}

export default InboxPage;
