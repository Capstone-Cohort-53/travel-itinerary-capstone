import type { Request, Response } from 'express'
import { STATUS_CODES } from 'node:http'
import type { ZodError } from 'zod/v4'

/**
 * Shape of every error body returned by the API.
 *
 * Modeled on the RESTful error pattern demonstrated in the Codebreaker Solitaire
 * OpenAPI scheme: errors are returned with a real HTTP status code AND a
 * structured body describing the failure.
 *
 * @property timestamp ISO 8601 timestamp of when the error was produced
 * @property status HTTP response status code (matches the status line)
 * @property error HTTP response status text (e.g. 'Not Found' for 404)
 * @property message additional, human-readable error message
 * @property path host-relative URL of the request that failed
 * @property details optional extra detail, generally included with validation errors
 */
export interface ErrorResponse {
    timestamp: string
    status: number
    error: string
    message: string
    path: string
    details?: unknown
}

/**
 * Sends a structured error response with the given HTTP status code.
 *
 * @param request the Express request (used to populate the `path` field)
 * @param response the Express response to send on
 * @param status the HTTP status code to return (e.g. 400, 404, 409, 500)
 * @param message a human-readable description of what went wrong
 * @param details optional additional detail (e.g. field-level validation issues)
 */
export function sendError (request: Request, response: Response, status: number, message: string, details?: unknown): void {
    const body: ErrorResponse = {
        timestamp: new Date().toISOString(),
        status,
        error: STATUS_CODES[status] ?? 'Error',
        message,
        path: request.originalUrl
    }

    // only include details when the caller actually supplied them
    if (details !== undefined) {
        body.details = details
    }

    response.status(status).json(body)
}

/**
 * Sends a 500 Internal Server Error with a generic message.
 *
 * Used in controller catch blocks for unexpected failures, so internals are
 * never leaked and every "something went wrong" response is identical.
 *
 * @param request the Express request (used to populate the `path` field)
 * @param response the Express response to send on
 */
export function sendServerError (request: Request, response: Response): void {
    sendError(request, response, 500, 'internal server error occurred try again later')
}

/**
 * Sends a 400 Bad Request built from a Zod validation error.
 *
 * The top-level `message` is the first issue's message (for a quick summary),
 * while `details.issues` carries the full, field-level breakdown.
 *
 * @param request the Express request (used to populate the `path` field)
 * @param response the Express response to send on
 * @param error the ZodError produced by a failed `safeParse`
 */
export function sendZodError (request: Request, response: Response, error: ZodError): void {
    const message = error.issues[0]?.message ?? 'A validation error occurred'
    const details = {
        issues: error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
        }))
    }
    sendError(request, response, 400, message, details)
}