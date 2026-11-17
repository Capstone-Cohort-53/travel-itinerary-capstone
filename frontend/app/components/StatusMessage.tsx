import type { FormActionResponse } from "~/utils/interfaces/FormActionResponse";

type StatusMessageProps = { actionData: FormActionResponse | undefined };

/**
 * Displays the result of a form action: green for success, red for failure.
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
        ? "bg-green-50 border-green-200 text-green-700"
        : "bg-red-50 border-red-200 text-red-700";

    return (
        <div role={actionData.success ? "status" : "alert"} className={`mt-4 p-4 border rounded-lg text-sm ${colors}`}>
            {message}
        </div>
    );
}