import { Request, Response, NextFunction } from 'express'
import { createWriteStream, existsSync, mkdirSync } from 'fs'
import path from 'path'

const LOG_DIR = path.join(__dirname, '..', '..', 'logs')

// Ensure log directory exists on startup.
if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true })
}

// Create a stream to append to the log file.
const accessLogStream = createWriteStream(path.join(LOG_DIR, 'access.log'), {
  flags: 'a',
})

const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Log after the response has finished.
  res.on('finish', () => {
    const logEntry = `${new Date().toISOString()} ${req.ip} ${req.method} ${
      req.originalUrl
    } ${res.statusCode}\n`

    // Write to both console and the file stream.
    process.stdout.write(logEntry)
    accessLogStream.write(logEntry)
  })

  // Pass control to the next handler.
  next()
}

export default loggerMiddleware
