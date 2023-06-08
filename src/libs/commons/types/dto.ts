import { Filter } from '../utils/filter';

declare global {
    type PageableSortTupple = [string, Pageable.Sorts.ASC | Pageable.Sorts.DESC];
    type PageableSort = PageableSortTupple | PageableSortTupple[];
    interface Pageable {
        page: number;
        size: number;
        sort: PageableSort | Pageable.Sorts.UNSORT;
    }

    namespace DTO {
        interface Auditable extends Timestamp {
            createdBy: string;
            updatedBy: string;
        }
        interface Timestamp {
            createdAt: Date;
            updatedAt: Date;
        }

        export interface Whoami {
            id: string;
            nik: string;
            name: string;
            telegramId: number;

            email: string;
            username: string;
            witel: Mars.Witel;
            sto: string;

            group?: Group;
            roles: string[];
        }

        export interface Users {
            id: string;
            name: string;
            nik: string;
            phone: string;
            active: boolean;
            tg: {
                id: number;
                username: string;
            };

            group: Group;
            roles: Role[];
        }
        export interface UserApproval extends Timestamp {
            id: string;
            name: string;
            nik: string;
            no: string;
            phone: string;
            status: string;
            sto: null;
            tg: { id: number; username: string };
            witel: Mars.Witel;
        }
        export interface Group {
            id: string;
            name: string;
        }
        export interface Role {
            id: string;
            name: string;
            order: number;
        }

        export interface Ticket extends Auditable {
            id: string;
            no: string;

            witel: Mars.Witel;
            sto: string;
            incidentNo: string;
            serviceNo: string;
            status: Mars.Status;
            source: Mars.Source;

            senderId: number;
            senderName: string;

            note: string;

            gaul: boolean;
            gaulCount: number;

            product: Mars.Product;
            issue: Issue;

            agentCount: number;

            wip: boolean;
            wipBy?: string;

            // assets?: string[];
        }
        export interface TicketAgent extends Auditable {
            id: string;
            status: Mars.AgentStatus;
            user: Users;
            files: string[];
            description?: string;
        }
        export interface TicketLog {
            id: number;
            message: string;
            prev: Mars.Status;
            curr: Mars.Status;
            createdBy: string;
            createdAt: Date;
            // private long id;
            // private Ticket ticket;
            // private String message;

            // @Enumerated(EnumType.STRING)
            // @Column(name = "prev_status")
            // private TcStatus prev;

            // @Enumerated(EnumType.STRING)
            // @Column(name = "curr_status")
            // private TcStatus curr;

            // @ManyToOne
            // @JsonIgnore
            // @JoinColumn(name = "ref_agent_id")
            // private TicketAgent agent;

            // @CreatedBy
            // @Column(name = "created_by", updatable = false)
            // private String createdBy;

            // @CreatedDate
            // @Column(name = "created_at", updatable = false)
            // @JsonSerialize(using = InstantSerializer.class)
            // @JsonDeserialize(using = InstantDeserializer.class)
            // private Instant createdAt;
        }

        export interface CreateGroup {
            name: string;
            login: boolean;
        }
        export interface CreateOrders {
            witel: Mars.Witel;
            sto: string;
            incidentno: string;
            problemtype: string;
            serviceno: string;
            producttype: Mars.Product;

            sendertgid: number;
            sendername: string;

            ordersource: number;
            ordertext: string;
            attachment?: string;
            notes?: string;
        }

        export interface OrderRegister {
            witel: string; // Uppercase
            sto: string;
            incidentno: string;
            problemtype: string;
            serviceno: string;
            producttype: string;
        }

        export interface Issue {
            id: number;
            name: string;
            alias: string;
            product: Mars.Product;
            description: string;
            createdAt: Date;
            updatedAt: Date;

            params: IssueParam[];
        }
        export interface IssueParam {
            id: number;
            type: 'CAPTURE' | 'NOTE';
            display: string;
            required: boolean;
        }

        export interface OrdersDashboard {
            orders: DTO.Ticket[];
            counts: Record<Mars.Product, number>;
        }

        export interface Solution extends Auditable {
            id: number;
            name: string;
            product: Mars.Product;
            description: string;
        }

        export interface Setting {
            id: number;
            name: string;
            title: string;
            type: SettingType;
            value: string;
            description: string;
        }

        export interface Agent extends Auditable {
            id: string;
            nik: string;
            telegramId: number;
        }
        export interface AgentWorkspace extends Timestamp {
            id: number;
            status: Mars.AgentStatus;
            agent: Agent;
            worklogs: AgentWorklog[];
        }
        export interface AgentWorklog extends Timestamp {
            id: number;
            takeStatus: Mars.Status;
            closeStatus: Mars.Status;

            solution: number;
            message: string;
            reopenMessage: string;

            ticket?: {
                id: string;
                no: string;
                status: Mars.Status;
                createdAt: Date;
                updatedAt: Date;
            }
        }
    }

    // globalThis.DTO = DTO;

    namespace DTO {
        namespace Request {
            interface GetProblemSymptoms {
                product: Mars.Product;
                name: string;
            }

            interface SendMessageToUser {
                id: number;
                message: string;

                mode?: 'Markdown' | 'MarkdownV2' | 'HTML';
                escaped?: boolean;
            }

            interface SendAutoClose {
                orderno: number;
                user_id: number;
            }
            interface SendDispatchInfo {
                orderno: number;
                user_id: number;
            }
            interface SendStatusChange {
                orderno: number;
                user_id: number;
                new_status: Mars.Status;
            }
        }
    }

    namespace JWT {
        export interface Payload {
            sub: string;
            tg: number;
            name: string;
            image: string | null;
            group: {
                id: string;
                name: string;
            };
        }
    }
}

declare global {
    namespace DTO {
        namespace Tg {
            type Confirmation<T extends map> = { answer: 0 | 1 } & T;
        }
    }

    type ICriteria<Model> = {
        [P in keyof Model]?: ICriteriaValue<NonNullable<Model[P]>>;
    };

    type ICriteriaValue<T> = T extends Array<infer I>
        ? Array<ICriteriaValue<NonNullable<I>>>
        : T extends Date
        ? Filter.Of<Date>
        : T extends object
        ? ICriteria<NonNullable<T>>
        : Filter.Of<NonNullable<T>>;
}
