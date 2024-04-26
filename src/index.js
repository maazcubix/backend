
import connection from "../db/index.js";
import { app } from "./app.js";


connection().then(

    app.listen(process.env.PORT || 8000,()=>{
        console.log("server is running on porty ",process.env.PORT);
    })
).catch(err=>console.log("connection failed",err))