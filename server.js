import app from "./app.js"
import { dbconnect } from "./config/db.config.js";

const PORT = process.env.PORT || 4000;

await dbconnect();
app.listen(PORT,() => {
    console.log(`server is running on ${PORT}`)
})