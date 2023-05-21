import { isAbsolute, join } from "path";
import { isDefined, isStr } from "./guards";

export function upperCase(str: string, firstLetterOnly = false) {
    if (firstLetterOnly) {
        return str[0].toUpperCase() + str.slice(1).toLowerCase();
    }
    return str.toUpperCase();
}

export function camelCaseToKebabCase(camelCaseString: string) {
    return camelCaseString
        .replace(/([a-z])([A-Z0-9])/g, "$1-$2")
        .toLowerCase();
}

export function kebabCaseToCamelCase(kebabCaseString: string) {
    return kebabCaseString
        .split("-")
        .map((str, i) => (i === 0 ? str : upperCase(str, true)))
        .join("");
}

export function replaceCurlyBracesText(
    text: string,
    replacer: Record<string | number, string | number | boolean>
) {
    const keys = Object.keys(replacer).map((str) => {
        return [new RegExp(`({${str}})`, "g"), replacer[str]] as const;
    });

    keys.forEach((key) => text.replace(key[0], key[1] + ""));
    return text;
}

/**
 *
 * @param length default `12`
 * @param includeSymbols
 * @returns {string} a random string.
 */
export function randomString(length = 12, includeSymbols = true): string {
    const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numrc = "1234567890";
    const possible =
        alpha +
        alpha.toLowerCase() +
        numrc +
        (includeSymbols ? "!@#$%^&*" : "");

    let res = "";
    for (let i = 0; i < length; i++) {
        const rand = Math.floor(Math.random() * possible.length);
        res += possible[rand];
    }

    return res;
}

export function normalizePath(path: string) {
    return isAbsolute(path) ? path : join(process.cwd(), path);
}

normalizePath.toUnix = function (path: string) {
    return path.replace(/\\/g, "/");
};

normalizePath.joinUnix = function (...segments: string[]) {
    return normalizePath.toUnix(join(...segments));
};

export function mergeClassName(...inputs: InputName[]) {
    return inputs
        .flatMap((input) => {
            if (!isDefined(input)) return;
            else if (isStr(input)) return input;
            return Object.entries(input).map((e) => {
                if (!!e[1]) return e[0];
            });
        })
        .filter(isStr)
        .join(" ");
}

type InputName =
    | string
    | { [x: string]: boolean | undefined | null }
    | undefined
    | null;
