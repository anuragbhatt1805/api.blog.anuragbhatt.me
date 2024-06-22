import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './src/database/index.js';
import { App } from './src/app.js';

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    App.listen(PORT, () => {
        console.log(`SERVER: Server is running on port ${PORT}`);
        console.log(`LINK: http://localhost:${PORT}`);
    });
    App.on('error', (error) => {
        console.error("EXPRESS: Express error:", error);
    });
}).catch((error) => {
    console.error("MONGO: Database connection error:", error);
})