namespace DTO {
    export enum SettingType {
        STRING = 'STRING',
        BOOLEAN = 'BOOLEAN',
        // JSON = 'JSON',
        // ARRAY = 'ARRAY',
        DURATION = 'DURATION',
        CHARACTER = 'CHARACTER',
        INTEGER = 'INTEGER',
        LONG = 'LONG',
        DOUBLE = 'DOUBLE',
        SHORT = 'SHORT',
        FLOAT = 'FLOAT',
        LIST = 'LIST',
    }
    export enum SettingKey {
        APP_ALLOW_AGENT_CREATE_TICKET_BOOL = "agent-allowed-to-create-ticket",
        APP_USER_REGISTRATION_APPROVAL_BOOL = "user-registration-approval",
        APP_USER_REGISTRATION_APPROVAL_DRT = "user-registration-approval-duration",
    
        ACC_EXPIRED_BOOL = "account-expireable",
        ACC_EXPIRED_DRT = "account-expired-duration",
        ACC_REGISTRATION_EMAILS_LIST = "account-registration-approval-email",
    
        CRD_PASSWORD_ALGO_STR = "password-algo",
        CRD_PASSWORD_SECRET_STR = "password-secret",
        CRD_PASSWORD_HASH_ITERATION_INT = "password-hash-iteration",
        CRD_PASSWORD_HISTORY_INT = "password-history",
    
        JWT_TOKEN_REFRESH_EXPIRED_DRT = "token-refresh-expired",
        JWT_TOKEN_EXPIRED_DRT = "token-expired",
    
        TG_CONFIRMATION_DRT = "confirmation-duration",
        TG_PENDING_CONFIRMATION_DRT = "confirmation-pending-duration",
        TG_START_CMD_ISSUE_COLUMN_INT = "tg-stat-command-issue-col-count"
    }
}

namespace Pageable {
    export enum Sorts {
        DESC = 'DESC',
        ASC = 'ASC',
        UNSORT = 'UNSORT',
    }
}

namespace NodeJS {
    export enum SystemErr {
        EACCES = 'EACCES',
        EADDRINUSE = 'EADDRINUSE',
        ECONNREFUSED = 'ECONNREFUSED',
        ECONNRESET = 'ECONNRESET',
        EEXIST = 'EEXIST',
        EISDIR = 'EISDIR',
        EMFILE = 'EMFILE',
        ENOENT = 'ENOENT',
        ENOTDIR = 'ENOTDIR',
        ENOTEMPTY = 'ENOTEMPTY',
        ENOTFOUND = 'ENOTFOUND',
        EPERM = 'EPERM',
        EPIPE = 'EPIPE',
        ETIMEDOUT = 'ETIMEDOUT',
    }
}

// globalThis.Pageable = Pageable;
// globalThis.NodeJS = NodeJS;
addToGlobal({ Pageable, NodeJS, DTO });
