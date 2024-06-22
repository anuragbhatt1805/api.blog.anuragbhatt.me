import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

export const App = express();

App.use(express.json());
App.use(cookieParser());
App.use(cors({
    origin: process.env.CORS_ORIGIN,
}));
App.use(express.urlencoded({ extended: true }));
App.use(express.static('public'));