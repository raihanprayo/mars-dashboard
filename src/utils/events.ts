export class RefreshBadgeEvent extends Event {
    constructor() {
        super('refresh-badge');
    }

    static emit() {
        window.dispatchEvent(new RefreshBadgeEvent());
    }
}
