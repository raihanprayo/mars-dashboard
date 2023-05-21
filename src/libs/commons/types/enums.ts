namespace DTO {
    export enum SettingType {
        STRING = 'STRING',
        NUMBER = 'NUMBER',
        BOOLEAN = 'BOOLEAN',
        JSON = 'JSON',
        ARRAY = 'ARRAY',
        DURATION="DURATION"
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
