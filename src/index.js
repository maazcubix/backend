import connection from "./db/index.js";
import { app } from "./app.js";

const PORT = process.env.PORT || 8000;

connection()
  .then(
    app.listen(PORT, () => {
      console.log("server is running on porty ", PORT);
    })
  )
  .catch((err) => console.log("connection failed", err));
