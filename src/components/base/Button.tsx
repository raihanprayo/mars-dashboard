import { Button, ButtonProps } from 'antd';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

const defaultDisabledOnRole = () => false;
export function MarsButton(props: MarsButtonProps) {
    const session = useSession();
    const { disabled = false, disabledOnRole = defaultDisabledOnRole, ...others } = props;

    const shouldBeDisabled = useMemo(() => {
        if (session.status !== 'authenticated') return disabled;

        const roles = session.data.roles;
        return roleCheck(roles, disabledOnRole) || disabled;
    }, [session]);

    return <Button {...others} disabled={shouldBeDisabled} />;
}
export namespace MarsButton {
    export type DisableOnRoleCheck = (role: string) => boolean;

    export const disableIfAdmin: DisableOnRoleCheck = (r: string) => r === 'admin';
    export const disableIfUser: DisableOnRoleCheck = (r: string) => r === 'user';
}

export interface MarsButtonProps extends ButtonProps {
    /** has higher order then normal `disabled`. */
    disabledOnRole?(role: string): boolean;
}

function roleCheck(roles: string[], cb: MarsButton.DisableOnRoleCheck) {
    for (const role of roles) {
        const disabled = cb(role);
        if (disabled) return true;
    }
    return false;
}
