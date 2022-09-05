import { Tag } from "antd";

export namespace ColRender {
    const orderStatusTagColor = {
        [Mars.Status.OPEN]: "#ffa36a",
        [Mars.Status.CLOSED]: "#14f714",
        [Mars.Status.DISPATCH]: "#c5342f",
        [Mars.Status.GAUL]: "#ffa36a",
    };

    export function orderStatus(v: Mars.Status) {
        return (
            <Tag className="tag-status" color={orderStatusTagColor[v]}>
                {v}
            </Tag>
        );
    }

    export function product(v: Mars.Product) {
        return <Tag className="tag-status">{v}</Tag>;
    }
}
