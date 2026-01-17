import winston, { format, transports } from "winston";

export class LoggerConfig {
    private readonly options: winston.LoggerOptions;
    constructor() {
        this.options = {
            exitOnError: false,
            format: format.combine(
                format.colorize(),
                format.timestamp(),
                format.printf((msg) => {
                    return `${msg.timestamp} [${msg.level}] - ${msg.message}`;
                }),
            ),
            transports: [
                new transports.Console({
                    level: process.env.LOG_LEVEL,
                }),
            ], // al        ert > error > warning > notice > info > debug
        };
    }

    public console() {
        return this.options;
    }
}