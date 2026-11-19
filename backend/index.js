import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Dữ liệu đã thông!"))
  .catch(err => console.log("Lỗi rồi: ", err));

app.listen(5000, () => console.log("Server đang chạy ở cổng 5000"));