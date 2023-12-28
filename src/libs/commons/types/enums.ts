export namespace Pageable {
    export enum Sorts {
        DESC = "DESC",
        ASC = "ASC",
        UNSORT = "UNSORT",
    }
}

namespace NodeJS {
    export enum SystemErr {
        EACCES = "EACCES",
        EADDRINUSE = "EADDRINUSE",
        ECONNREFUSED = "ECONNREFUSED",
        ECONNRESET = "ECONNRESET",
        EEXIST = "EEXIST",
        EISDIR = "EISDIR",
        EMFILE = "EMFILE",
        ENOENT = "ENOENT",
        ENOTDIR = "ENOTDIR",
        ENOTEMPTY = "ENOTEMPTY",
        ENOTFOUND = "ENOTFOUND",
        EPERM = "EPERM",
        EPIPE = "EPIPE",
        ETIMEDOUT = "ETIMEDOUT",
    }
}

declare global {
    type PageableSortTupple = [
        string,
        Pageable.Sorts.ASC | Pageable.Sorts.DESC
    ];
    type PageableSort = PageableSortTupple | PageableSortTupple[];
    interface Pageable {
        page: number;
        size: number;
        sort: PageableSort | Pageable.Sorts.UNSORT;
    }
}

addToGlobal({ Pageable, NodeJS });
