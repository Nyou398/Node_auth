const express = require('express');
require('dotenv').config({ path: "./config.env" });
const connectDB = require("./config/db");
const errorHandler = require("./middleware/error");

//Midleware 
const app = express();
app.use(express.json());
connectDB();
app.use(errorHandler);


// Connections aux routes :
app.use('/api/auth', require('./routes/auth'));
app.use('/api/private', require('./routes/private'));

//Le port du serveur
const PORT = process.env.PORT || 8000;


//permet de mieux lire les erreur dans le terminal
const server = app.listen(PORT, () =>
    console.log(`Sever running on port ${PORT}`)
);
process.on("unhandledRejection", (error, promise) => {
    console.log(`Logged Error: ${error}`);
    server.close(() => process.exit(1));
});