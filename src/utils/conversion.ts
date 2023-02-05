import { DefaultOptionType } from 'antd/lib/select/index';
import Head from 'next/head';
import { createElement, Fragment } from 'react';

export function zeroPadStart(input: string | number, length = 2) {
    return String(input).padStart(length, '0');
}

export function mapEnum<T extends map>(o: T) {
    const values = Object.values(o).filter((e) => !/^(\d)+$/.test(e));
    return values.map<DefaultOptionType>((e) => ({ label: e, value: e }));
}

export function PageTitle<P = any>(title: string, comp: React.ComponentType<P>) {
    const w: React.FC<any> = (props: any) =>
        createElement(PageTitle.Wrap, {
            title,
            children: createElement(comp, props),
        });

    w.displayName = (comp.displayName || comp.name) + 'Wrapped';
    return w;
}
export namespace PageTitle {
    interface TitleWrapperProps {
        title: string;
        children: React.ReactElement;
    }

    export function Wrap(props: TitleWrapperProps) {
        return createElement(
            Fragment,
            {},
            createElement(Head, {
                children: createElement('title', {}, `Mars - ${props.title}`),
            }),
            props.children
        );
    }
    Wrap.displayName = 'TitleWrapper';
}
