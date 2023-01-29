import { DefaultOptionType } from "antd/lib/select/index";

export function zeroPadStart(input: string | number, length = 2) {
    return String(input).padStart(length, "0");
}

export function mapEnum<T extends map>(o: T) {
    const values = Object.values(o).filter((e) => !/^(\d)+$/.test(e));
    return values.map<DefaultOptionType>((e) => ({ label: e, value: e }));
}