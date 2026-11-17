import type { Status } from "~/utils/interfaces/Status";

/**
 * The outcome of the API call a form action made: whether the request worked,
 * plus the normalized Status (code, data, message) to display.
 */
export type FormActionResponse = { success: boolean; status: Status };