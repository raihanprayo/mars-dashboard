import { isStr } from '@mars/common';
import { Tag } from 'antd';
import { differenceInSeconds, format } from 'date-fns';

export namespace Render {
    const orderStatusTagColor = {
        [Mars.Status.OPEN]: '#ffa36a',
        [Mars.Status.CLOSED]: '#14f714',
        [Mars.Status.DISPATCH]: '#c5342f',
    };
    const productTagColor = {
        [Mars.Product.INTERNET]: 'red',
        [Mars.Product.IPTV]: 'cyan',
        [Mars.Product.VOICE]: 'blue',
    };
    const orderSourceTagColor = {
        [Mars.Source.GROUP]: 'red',
        [Mars.Source.PRIVATE]: 'cyan',
        [Mars.Source.OTHER]: 'yellow',
    };
    const witelTagColor = {
        [Mars.Witel.BANTEN]: 'red',
        [Mars.Witel.BEKASI]: 'cyan',
        [Mars.Witel.BOGOR]: 'yellow',
        [Mars.Witel.JAKBAR]: 'purple',
        [Mars.Witel.JAKPUS]: 'green',
        [Mars.Witel.JAKSEL]: 'lemon',
        [Mars.Witel.JAKTIM]: 'geekblue',
        [Mars.Witel.JAKUT]: 'lime',
        [Mars.Witel.TANGERANG]: 'volcano',
    };

    export const DATE_WITH_TIMESTAMP = 'EEEE, dd MMMM yyyy - HH:mm';
    export const DATE_WITHOUT_TIMESTAMP = 'EEEE, dd MMMM yyyy';

    export function orderStatus(v: Mars.Status, bold = false) {
        return (
            <Tag className="tag-status" color={orderStatusTagColor[v]}>
                {bold ? <b>{v}</b> : v}
            </Tag>
        );
    }

    export function product(v: Mars.Product) {
        return (
            <Tag className="tag-status" color={productTagColor[v]}>
                <b>{v}</b>
            </Tag>
        );
    }

    export function witel(v: Mars.Witel) {
        return (
            <Tag className="tag-status" color={witelTagColor[v]}>
                <b>{v}</b>
            </Tag>
        );
    }

    export function bool(v: boolean, opt: BoolRenderOpt = {}) {
        const { trueText = 'Ya', falseText = 'Tidak', reverseColor = false } = opt;
        const tColor = 'red';
        const fColor = 'blue';

        const color = reverseColor ? (v ? fColor : tColor) : v ? tColor : fColor;

        return (
            <Tag className="tag-status" color={color}>
                <b>{(v ? trueText : falseText).toUpperCase()}</b>
            </Tag>
        );
    }

    export function orderSource(v: Mars.Source) {
        return (
            <Tag className="tag-status" color={orderSourceTagColor[v]}>
                <b>{Mars.Source[v]}</b>
            </Tag>
        );
    }

    export function date(v: string | Date, dateFormat: string) {
        if (isStr(v)) v = new Date(v);
        return format(v, dateFormat);
    }

    export function calcOrderAge(opentime: Date | string, from?: Date) {
        if (isStr(opentime)) opentime = new Date(opentime);
        const current = from || new Date();
        const diffSec = differenceInSeconds(current, opentime);
        const diffHour = Math.floor(diffSec / 3600);
        const diffMin = Math.floor((diffSec - diffHour * 3600) / 60);
        return { hour: diffHour, minute: diffMin };
    }
}

interface BoolRenderOpt {
    trueText?: string;
    falseText?: string;
    reverseColor?: boolean;
}
