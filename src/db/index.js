import mongoose, { connections } from "mongoose";
import { DB_NAME } from "../constant.js";

const connection = async () => {
  try {
    const connection =
      await mongoose.connect(`mongodb://127.0.0.1:27017/videoTube
        `);
    console.log(connection.connection.host, "mogodb connedted");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export default connection;
