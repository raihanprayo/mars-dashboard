import { Button, ButtonProps } from 'antd';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { ROLE_ADMIN, ROLE_AGENT, ROLE_USER } from '_utils/constants';

const defaultDisabledOnRole = () => false;

export function MarsButton(props: MarsButtonProps) {
    const session = useSession();
    const { disabled = false, disabledOnRole = defaultDisabledOnRole, ...others } = props;

    const shouldBeDisabled = useMemo(() => {
        if (session.status !== 'authenticated') return disabled;

        const roles = session.data.roles;
        return roleCheck(roles, disabledOnRole) || disabled;
    }, [session, disabled]);

    return <Button {...others} disabled={shouldBeDisabled} />;
}
export namespace MarsButton {
    export type DisableOnRoleCheck = (role: string) => boolean;

    export const disableIfAdmin: DisableOnRoleCheck = (r: string) => r === ROLE_ADMIN;
    export const disableIfUser: DisableOnRoleCheck = (r: string) =>
        r === ROLE_AGENT || r === ROLE_USER;
}

export interface MarsButtonProps extends ButtonProps {
    /** has higher order then normal `disabled`. */
    disabledOnRole?(role: string): boolean;
}

function roleCheck(roles: string[], cb: MarsButton.DisableOnRoleCheck) {
    return roles.map(cb).indexOf(true) !== -1;
}
