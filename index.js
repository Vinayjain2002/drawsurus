const express = require("express");
const dotenv = require("dotenv");
const http= require("http");
const cors= require("cors");
const compression= require("compression");
const ratelimiter= require("express-rate-limit");
const slowDown= require("express-slow-down");
const winston= require("winston");
const helmet= require("helmet");
const connectDB= require("./database/MongoDB");
const SocketManager = require("./database/socket");

const adminRoutes= require("./routes/admin");
const authRoutes= require("./routes/auth");
const gameRoutes= require("./routes/game")
const roomRoutes= require("./routes/room")
const userRoutes= require("./routes/user")

dotenv.config();

connectDB();

const app= express();
const server= http.createServer(app);

// using the middlewares
app.use(cors());
app.use(helmet());
app.use(express.json({limit: "10kb"}));
app.use(express.urlencoded({extended: true, limit: "10kb"}));
app.use(compression());

// creating a window of the 15 minutes and in this window 200 req are allowed for a ip
const limiter = ratelimiter({
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




app.use("/admin", adminRoutes);
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/game", gameRoutes);
app.use("/room", roomRoutes);
app.get("/health", (req,res)=>{
    res.status(200).json({status: "ok"});
});



const socketManager = new SocketManager(server);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    winston.info(`Server running on port ${PORT}`);
});
