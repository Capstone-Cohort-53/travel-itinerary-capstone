type FieldErrorProps = {
    id: string;
    meta: { isTouched: boolean; errors: unknown[] };
};

/**
 * Shows one field's first validation message, but only after the user has
 * touched that field, so untouched inputs further down the form stay quiet.
 * The `id` is what the input's aria-describedby points at.
 */
export function FieldError(props: FieldErrorProps) {
    const { id, meta } = props;

    // a Zod issue is an object with a message; a server error may be a plain string
    const messages = meta.errors
        .map((error) => (typeof error === "string" ? error : (error as { message?: string } | null)?.message))
        .filter((message): message is string => Boolean(message));

    if (!meta.isTouched || messages.length === 0) {
        return <></>;
    }

    return (
        <p id={id} role="alert" className="mt-1 text-sm font-medium text-royal-red">
            {messages[0]}
        </p>
    );
}
