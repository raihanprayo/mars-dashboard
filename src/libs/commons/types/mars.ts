export namespace Mars {
    export enum Witel {
        ROC = 'ROC',
        ROC_VOICE = 'ROC_VOICE',
        ROC_TIAL = 'ROC_TIAL',
        BANTEN = 'BANTEN',
        BEKASI = 'BEKASI',
        BOGOR = 'BOGOR',
        JAKBAR = 'JAKBAR',
        JAKPUS = 'JAKPUS',
        JAKSEL = 'JAKSEL',
        JAKTIM = 'JAKTIM',
        JAKUT = 'JAKUT',
        TANGERANG = 'TANGERANG',
    }
    export enum Product {
        INTERNET = 'INTERNET',
        IPTV = 'IPTV',
        VOICE = 'VOICE',
        OTHERS = 'OTHERS',
    }
    export enum Status {
        OPEN = 'OPEN',
        REOPEN = 'REOPEN',
        CONFIRMATION = 'CONFIRMATION',
        PENDING = 'PENDING',
        PROGRESS = 'PROGRESS',
        CLOSED = 'CLOSED',
        DISPATCH = 'DISPATCH',
    }
    export enum AgentStatus {
        PROGRESS = 'PROGRESS',
        CLOSED = 'CLOSED',
    }

    export enum UserStatus {
        ACTIVE = 'ACTIVE',
        SUSPEND = 'SUSPEND',
    }
    export enum Source {
        PRIVATE,
        GROUP,
        OTHER,
    }
}

globalThis.Mars = Mars;