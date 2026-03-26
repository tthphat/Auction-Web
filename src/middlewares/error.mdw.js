export const errorMiddleware = (err, req, res, next) => {
    const statsusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statsusCode).json({ error: message });
}
