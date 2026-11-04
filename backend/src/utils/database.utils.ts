import postgres from 'postgres'

const port = process.env.POSTGRES_PORT ?? '0'
const parsedPort = parseInt(port)

export const sql = postgres({
    user: process.env.POSTGRES_USER,
    port: parsedPort,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: 'require',
    transform: {
        column: {
            from: postgres.toCamel, to: postgres.fromCamel
        }
    }
})
// Postgres SQLSTATE for a unique-constraint violation (duplicate value in a UNIQUE column)
const UNIQUE_VIOLATION = '23505'

/**
 * Was this error thrown by Postgres because a UNIQUE constraint was violated
 * (e.g. a duplicate email or name)? Controllers map it to `409 Conflict`.
 *
 * @param error anything caught in a controller's catch block
 */
export function isUniqueViolation (error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === UNIQUE_VIOLATION
}