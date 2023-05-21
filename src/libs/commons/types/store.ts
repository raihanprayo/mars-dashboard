namespace Store {
    export namespace Callback {
        export enum Type {
            CONFIRMATION,
            REPLY_INPUT,
        }
        export const CONFIRMATION = Type.CONFIRMATION;
        export const REPLY_INPUT = Type.REPLY_INPUT;

        export interface State {
            type: Type;
            user_id: number
        }
    }

    export namespace Order {
        export interface BaseState extends Callback.State {
            order: true;
        }

        export interface AutoClose extends BaseState {
            type: Callback.Type.CONFIRMATION;
            diff: 'auto-close';

            order_no: number;
        }

        export interface ReplyReopen extends BaseState {
            type: Callback.Type.REPLY_INPUT;
            diff: 'reopen';
        }
    }
}

addToGlobal({ Store });
