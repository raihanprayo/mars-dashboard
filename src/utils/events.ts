export class RefreshBadgeEvent extends Event {
    constructor() {
        super('refresh-badge');
    }

    static emit() {
        window.dispatchEvent(new RefreshBadgeEvent());
    }
}

export class CopyAsGaulTicketEvent extends Event {
    constructor(readonly data: DTO.Ticket) {
        super('dup-ticket');
    }

    static emit(data: DTO.Ticket) {
        window.dispatchEvent(new CopyAsGaulTicketEvent(data));
    }
}
