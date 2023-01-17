import type { Rule } from 'antd/lib/form/index';

export namespace FormRules {
    export const REQUIRED: Rule = { required: true };

    export const ROLE_RULE: Rule = {
        validator(rule, value, callback) {
            if (!value || value.selected.length <= 0)
                return callback('minimum seleted role: 1');

            callback();
        },
    };
}
