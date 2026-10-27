const express = require("express");
const cors = require("cors");
const main = require("./config/db");
const authRouter = require("./routes/auth");
const studyProfileRouter = require("./routes/studyProfile");
const availabilityRouter = require("./routes/availability");
const examRouter = require("./routes/exam");
const subjectRouter = require("./routes/subject");
const taskRouter = require("./routes/task");
const studyPlanRoutes = require("./routes/studyPlan");
const auth = require("./middleware/auth");
const studySessionRouter = require("./routes/studySession");
require("dotenv").config();



const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:1234")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        // Allow non-browser clients without an Origin header (e.g. local scripts).
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
}));
app.use(express.json());

const cookieParser = require("cookie-parser");

app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/study-profile",studyProfileRouter);
app.use("/api/availability",availabilityRouter);
app.use("/api/exam",examRouter);
app.use("/api/subject",subjectRouter);
app.use("/api/tasks",taskRouter);
app.use("/api/study-plan", studyPlanRoutes);
app.use("/api/study-sessions", studySessionRouter);
app.use("/api/ai", require("./routes/aiRecommendations"));

app.get("/api/test",(req, res) => {
  res.send("Backend is working properly");
});

app.get("/api/test/protected", auth, (req, res) => {
     console.log(req.user);
    res.send("Protected route working");
});



main()
.then(()=>{
   const port = process.env.PORT || 5000;
   app.listen(port, () => {
    console.log(`Server running on port ${port}`);
   });
})
.catch((err)=>{
     console.log("Error "+ err.message)
})

