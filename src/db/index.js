import mongoose from "mongoose";
import DB_NAME from '../constants.js'


const DB_connect = async () =>{
    try {
        const connectionInstance = mongoose.connect(`${process.env.DB_URL}/${DB_NAME}`)
        console.log(`DataBase Connected and here is connection host !! ${connectionInstance}`);
    } catch (error) {
        console.error('Database Connection Error',error);
    }
}

export default DB_connect