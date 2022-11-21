import { isArr, isStr, mergeClassName } from '@mars/common';
import { Carousel, Divider, Drawer } from 'antd';
import { CarouselRef } from 'antd/lib/carousel';
import getConfig from 'next/config';
import { createContext, useContext, useState } from 'react';

const ThumbnailContext = createContext<ThumbDrawerContext>({} as any);
ThumbnailContext.displayName = 'ThumbnailContext';

function ThumbnailDrawer(props: ThumbnailDrawerProps) {
    const ctx = useContext(ThumbnailContext);
    const config: NextAppConfiguration = getConfig();

    const url =
        ctx?.metadata?.url || props.url || config.publicRuntimeConfig.service?.file_url;
    const title = ctx?.metadata?.title || props.title;
    const files = ctx?.metadata?.files || props.files || [];

    const [drawer, setDrawer] = useState();
    const [carousel, setCarousel] = useState<CarouselRef>();
    const [picked, setPicked] = useState(0);

    return (
        <Drawer
            open={ctx.open ?? props.open}
            title={title}
            width="100%"
            className="thumb"
            onClose={(e) => {
                ctx?.setOpen?.(false);
                ctx?.setMetadata?.([], { title: null, url: null });
                props.onClose?.(e);
            }}
        >
            <div className="slide-container">
                <div
                    className="slide"
                    onClickCapture={(e) => {
                        const elm: HTMLElement = e.target as HTMLElement;
                        const shouldntClose =
                            elm.tagName === 'IMG' &&
                            elm.parentElement.classList.contains('thumbnail');

                        console.log(elm);
                        if (shouldntClose) return;

                        ctx?.setOpen?.(false);
                    }}
                >
                    <Carousel ref={setCarousel} arrows dots={false}>
                        {files.map((file) => (
                            <div className="thumbnail">
                                <img height={'100%'} src={url + file} />
                            </div>
                        ))}
                    </Carousel>
                </div>
                <ul className="slide-list" role="list">
                    <li className="slide-item" role="listitem" tabIndex={1}>
                        Abc
                    </li>
                    {files.map((file, i) => {
                        return (
                            <li
                                className={mergeClassName('slide-item', {
                                    active: i === picked,
                                })}
                                role="listitem"
                                tabIndex={1}
                                onClick={() => {
                                    setPicked(i);
                                    carousel.goTo(i, true);
                                }}
                            >
                                <div className="slide-item-thumb">
                                    <img src={url + file} />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </Drawer>
    );
}

ThumbnailDrawer.Provider = function (props: HasChild) {
    const [metadata, setMetadata] = useState<DrawerData>({ files: [] });
    const [open, setOpen] = useState<boolean>(false);

    return (
        <ThumbnailContext.Provider
            value={{
                metadata,
                setMetadata(files, opt = {}) {
                    setMetadata({ files, ...opt });
                },

                open,
                setOpen,
            }}
        >
            {props.children}

            <ThumbnailDrawer />
        </ThumbnailContext.Provider>
    );
};

ThumbnailDrawer.useDrawer = function (): ThumbDrawerHook {
    const ctx = useContext(ThumbnailContext);
    if (!ctx) return null;
    return {
        open(files: string[], opt: DrawerOpenOption = {}) {
            ctx.setMetadata(files, opt);
            ctx.setOpen(true);
        },
        close() {
            ctx.setOpen(false);
            ctx.setMetadata([], { title: null, url: null });
        },
    };
};

export default ThumbnailDrawer;

interface DrawerData {
    files: string[];

    title?: string;
    url?: string;
}

export interface ThumbnailDrawerProps {
    files?: string[];
    title?: string;
    url?: string;

    open?: boolean;
    onClose?(e: React.MouseEvent | React.KeyboardEvent): void;
}

export interface OrderDrawerProps {
    assignment: DTO.OrderAssignment;
    open?: boolean;
}

export interface ThumbDrawerContext {
    metadata: DrawerData;
    setMetadata(files: string[], opt?: DrawerOpenOption): void;

    open: boolean;
    setOpen(x: boolean): void;
}

export interface ThumbDrawerHook {
    open(files: string[], opt?: DrawerOpenOption): void;

    close(): void;
}

interface DrawerOpenOption {
    title?: string;
    url?: string;
}
