import MemoryStore from 'memorystore';
import expressSession from 'express-session';
import {v4 as uuid} from 'uuid';
import os from 'os';
import type { RequestHandler } from 'express';

const DEFAULT_SIZE_LIMIT = os.totalmem() * 0.8;
const SESSION_TIME_LIMIT =  1000 * 60 * 60 * 24; // 24 hours
const DEFAULT_CHECK_PERIOD = 1000 * 60 * 60; // hour

export function defaultAstroSession(): RequestHandler {
    const memorySessionCreator = MemoryStore(expressSession);

    return expressSession({
        store: new memorySessionCreator({
            checkPeriod: DEFAULT_CHECK_PERIOD,
            max: DEFAULT_SIZE_LIMIT
        }),
        secret: uuid(),
        resave: false,
        saveUninitialized: true,
        cookie: {maxAge: SESSION_TIME_LIMIT, httpOnly: true, signed: true}
    });
}