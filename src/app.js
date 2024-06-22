import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

export const App = express();

App.use(express.json({limit: '50kb'}));
App.use(cookieParser());
App.use(cors({
    origin: process.env.CORS_ORIGIN,
}));
App.use(express.urlencoded({ extended: true, limit: '5mb' }));
App.use(express.static('public'));

import { UserRouter } from './routes/User.routes.js';

App.use('/api/user', UserRouter);