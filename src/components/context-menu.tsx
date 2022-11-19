import { isDefined, isFn, mergeClassName } from '@mars/common';
import { List } from 'antd';
import { createContext, MouseEvent, useContext, useState } from 'react';

export const PopupContextMenu = createContext<PopupContextMenu>(null);

export function ContextMenu(props: HasChild) {
    const [pos, setPos] = useState<Tupple<number>>([0, 0]);
    const [data, setData] = useState();
    const [visible, setVisible] = useState(false);
    const [items, setItems] = useState<ContextMenuItem[]>([]);

    const display = visible ? undefined : 'none';
    const ctxValue: PopupContextMenu = {
        data,
        setData,

        visible,
        setVisible,

        items,
        setItems,

        position: pos,
        setPosition: setPos,
    };

    return (
        <PopupContextMenu.Provider value={ctxValue}>
            {props.children}
            <div className={'popup'} style={{ display, left: pos[0], top: pos[1] }}>
                <List<ContextMenuItem>
                    className="popup-list"
                    dataSource={items}
                    renderItem={(item) => {
                        const className = mergeClassName('popup-item', {
                            disabled: isFn(item.disable)
                                ? item.disable(data)
                                : item.disable,
                        });

                        return (
                            <List.Item
                                className={className}
                                onClick={(e) => item.onClick?.(e, item, data)}
                            >
                                {item.title}
                            </List.Item>
                        );
                    }}
                />
            </div>
        </PopupContextMenu.Provider>
    );
}

export interface PopupContextMenu {
    data: any;
    setData(d: any): void;

    visible: boolean;
    setVisible(v: boolean): void;

    position: Tupple<number>;
    setPosition(pos: Tupple<number>): void;

    items: ContextMenuItem[];
    setItems(items: ContextMenuItem[]): void;
}

export interface ContextMenuHook<D = any> {
    items: ContextMenuItem<D>[];

    readonly visible: boolean;

    readonly x: number;
    readonly y: number;
    popup(x: number, y: number, data?: D): void;
    dismiss(): void;
}

export interface ContextMenuItem<D = any> {
    title: string;
    disable?: boolean | ((data?: D) => boolean);
    onClick?(
        event: MouseEvent<HTMLDivElement>,
        item: Omit<ContextMenuItem, 'onClick'>,
        data?: D
    ): void;
}

export function useContextMenu<D = any>(): ContextMenuHook<D> {
    const c = useContext(PopupContextMenu);
    return Object.freeze<ContextMenuHook<D>>({
        x: c.position[0],
        y: c.position[1],
        visible: c.visible,

        popup(x, y, data) {
            c.setData(data);

            if (!c.visible) {
                document.addEventListener('click', function onClickOutside() {
                    c.setVisible(false);
                    c.setPosition([0, 0]);
                    c.setData(undefined);
                    document.removeEventListener('click', onClickOutside);
                });
            }
            c.setPosition([x, y]);
            c.setVisible(true);
        },

        dismiss() {
            c.setVisible(false);
            c.setPosition([0, 0]);
        },

        get items() {
            return c.items;
        },
        set items(n) {
            if (!isDefined(n)) n = [];
            c.setItems(n);
        },
    });
}
