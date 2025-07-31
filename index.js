const express = require("express");
const dotenv = require("dotenv");
const http= require("http");
const socketIo= require("socket.io");
const cors= require("cors");
const compression= require("compression");
const ratelimiter= require("express-rate-limit");
const slowDown= require("express-slow-down");
const winston= require("winston");
const helmet= require("helmet");
const connectDB = require("./database/MongoDB");
const winston= require('winston')
const expressWinston= require('express-winston');

dotenv.config();

connectDB();

const app= express();
const server= http.createServer(app);
const io= socketIo(server, {
    cors: {
        origin: "*",
        method: ["GET", "POST", "PUT", "DELETE"],
    }
});

// using the middlewares
app.use(cors());
app.use(helmet());
app.use(express.json({limit: "10kb"}));
app.use(express.urlencoded({extended: true, limit: "10kb"}));
app.use(compression());

// creating a window of the 15 minutes and in this window 200 req are allowed for a ip
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP
    standardHeaders: true,
    legacyHeaders: false,
  });

app.use(limiter);

const speedLimiter= slowDown({
    windowMs: 15*60*1000,
    delayAfter: 100,
    delayMs: 500
});

app.use(speedLimiter);

app.use(expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json()
    )
  }));
  

// defining a route for the health checkup
app.get("/health", (req,res)=>{
    res.status(200).json({status: "ok"});
});


// Api Routes are defined as the 



// Socket setup 
io.on("connection", (socket)=>{
    socket.on('disconnect', ()=>{
        console.log("Socket Disconnected");
    })
})

