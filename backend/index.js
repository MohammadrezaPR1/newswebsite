import express from "express";
import db from "./config/Database.js";
import userRoutes from "./routes/userRoute.js"
import categoryRoutes from "./routes/categoryRoute.js";
import videoRoutes from "./routes/videoRoute.js";
import newsRoutes from "./routes/newsRoute.js"
import commentRoutes from "./routes/commentRoute.js"
import sendEmailRoutes from "./routes/sendEmailRoute.js"
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import cors from "cors";


dotenv.config();
const app = express();
try {
    await db.authenticate();
    console.log("Database connected !");
    // await db.sync({ alter: true });
} catch (error) {
    console.log(`We have some error :
     ${error}`);
}



app.use(cors({credentials:true,origin:"http://localhost:5173"}))
app.use(express.json());
app.use(fileUpload());
app.use(express.static("public"));
app.use(cookieParser());
app.use(userRoutes);
app.use(categoryRoutes);
app.use(videoRoutes);
app.use(newsRoutes);
app.use(commentRoutes)
app.use(sendEmailRoutes)

app.listen(5000,()=>{
    console.log("Server running !");
});


