export enum HttpHeader {
    ACCEPT = 'Accept',
    ACCESS_CONTROL_ALLOW_ORIGIN = 'Access-Control-Allow-Origin',
    AUTHORIZATION = 'Authorization',
    API_KEY = 'Api-Key',
    CONTENT_TYPE = 'Content-Type',
    CONTENT_LENGTH = 'Content-Length',
    COOKIE = 'Cookie',
    SET_COOKIE = 'Set-Cookie',

    X_TOTAL_COUNT = 'x-total-count',
    X_TOTAL_PAGE = 'x-total-page',
    X_SORT = 'x-sort',
    X_TELG_ID = 'Telg-ID',
}

export enum MimeType {
    ALL = '*/*',

    APPLICATION_JSON = 'application/json',
    APPLICATION_PDF = 'application/pdf',
    APPLICATION_X_FORM_URL_ENCODED = 'application/x-www-form-urlencoded',
    APPLICATION_X_FORM_URL_ENCODED_UTF8 = 'application/x-www-form-urlencoded;UTF-8',

    MUTLIPART_FORM_DATA = 'multipart/form-data',

    TEXT_CSV = 'text/csv',
    TEXT_HTML = 'text/html',
    TEXT_PLAIN = 'text/plain',

    IMAGE_JPG = 'image/jpg',
    IMAGE_JPEG = 'image/jpeg',
    IMAGE_PNG = 'image/png',
    IMAGE_WEBP = 'image/webp',

}

export class ResponseEntity {
    body?: any;
    header?: map;
    status?: number;

    constructor(body?: any, opt: Partial<Omit<ResponseEntity, 'body'>> = {}) {
        this.body = body;
        this.header = opt?.header;
        this.status = opt?.status;
    }

    private static base(status: number, body?: any) {
        return new ResponseEntity({ status, body });
    }

    static ok(body?: any) {
        return ResponseEntity.base(200, body);
    }

    static created(body?: any) {
        return ResponseEntity.base(201, body);
    }

    static badRequest(body?: any) {
        return ResponseEntity.base(400, body);
    }

    static unauthorized(body?: any) {
        return ResponseEntity.base(401, body);
    }

    static build() {
        return new REBuilder();
    }
}

class REBuilder {
    readonly re = new ResponseEntity();
    status(s: number) {
        this.re.status = s;
        return this;
    }
    body(b: any) {
        this.re.body = b;
        return this;
    }
    header(h: map) {
        this.re.header = h;
        return this;
    }

    build() {
        return this.re;
    }
}
