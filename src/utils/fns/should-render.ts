export function doRender(
    condition: boolean,
    comp: React.ReactNode,
    onFalse?: React.ReactNode
) {
    return condition ? comp : onFalse ?? null;
}
