export {};

export function zeroPadStart(input: string | number, length = 2) {
    return String(input).padStart(length, "0");
}
