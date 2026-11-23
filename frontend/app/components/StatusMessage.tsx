import type { FormActionResponse } from "~/utils/interfaces/FormActionResponse";

type StatusMessageProps = { actionData: FormActionResponse | undefined };

/**
 * Displays the result of a form action: lilac for success, royal red for failure.
 * Renders nothing until the action has returned. A failure uses role="alert" so
 * a screen reader announces it right away; a success uses the quieter "status".
 */
export function StatusMessage(props: StatusMessageProps) {
    const { actionData } = props;

    if (!actionData) {
        return <></>;
    }

    const message = actionData.status.message ?? "an unexplained error occurred";
    const colors = actionData.success
        ? "bg-lilac/25 border-bay text-navy"
        : "bg-royal-red/5 border-royal-red text-royal-red";

    return (
        <div role={actionData.success ? "status" : "alert"} className={`mt-4 rounded-xl border-[1.5px] p-4 text-sm font-medium ${colors}`}>
            {message}
        </div>
    );
}