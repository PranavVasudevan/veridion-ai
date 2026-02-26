export class AppError extends Error {
    public readonly statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, AppError.prototype);
    }

    static badRequest(msg: string) {
        return new AppError(400, msg);
    }
    static unauthorized(msg = 'Unauthorized') {
        return new AppError(401, msg);
    }
    static forbidden(msg = 'Forbidden') {
        return new AppError(403, msg);
    }
    static notFound(msg = 'Not found') {
        return new AppError(404, msg);
    }
    static internal(msg = 'Internal server error') {
        return new AppError(500, msg);
    }
}
