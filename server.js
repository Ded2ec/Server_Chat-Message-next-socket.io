import { Server } from "socket.io";
import fetch from "node-fetch";

const io = new Server(3001, {
  cors: {
    origin: "http://localhost:3000", // URL ของ Next.js
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // รับข้อความจากผู้ใช้
  socket.on("send_message", async (message) => {
    console.log("Message received:", message);

    // บันทึกข้อความลงฐานข้อมูลผ่าน PostgREST
    await fetch("http://localhost:3333/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    // ดึงข้อมูลจากฐานข้อมูลผ่าน GET request
    try {
      const response = await fetch("http://localhost:3333/history", {
        method: "GET", // ใช้ GET สำหรับการดึงข้อมูล
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch history");
      }

      const data = await response.json(); // แปลงผลลัพธ์เป็น JSON

      console.log("History fetched:", data);
      // คุณสามารถส่งข้อมูล history ไปยังไคลเอนต์ได้ที่นี่
      socket.emit("history_data", data);

    } catch (error) {
      console.error("Error fetching history:", error);
    }

    // ส่งข้อความไปยังไคลเอนต์อื่น
    io.emit("new_message", message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
