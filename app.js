import Server from "./src/server/Server.js";

import * as dotenv from 'dotenv';
dotenv.config();

const appServer = new Server(process.env.PORT);
