import { Server } from "socket.io";
import fetch from "node-fetch";

const io = new Server(3001, {
  cors: {
    origin: "http://localhost:3000", // URL ของ Next.js
    methods: ["GET", "POST"]
  }
});

io.on("connection", async (socket) => {
  console.log("User connected:", socket.id);

  // ดึงข้อความย้อนหลัง 10 ข้อความจากฐานข้อมูลเมื่อมีการเชื่อมต่อ
  try {
    const response = await fetch("http://localhost:3333/messages?order=created_at.desc&limit=10");
    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}`);
    }
    const lastMessages = await response.json();
    // ส่งข้อความย้อนหลังให้ไคลเอนต์ที่เพิ่งเชื่อมต่อ
    socket.emit("previous_messages", lastMessages.reverse()); // ใช้ reverse เพื่อให้แสดงข้อความจากเก่ามาใหม่
  } catch (error) {
    console.error("Error fetching messages:", error.message);
  }

  // รับข้อความจากผู้ใช้
  socket.on("send_message", async (message) => {
    try {
      console.log("Message received:", message);

      // บันทึกข้อความลงฐานข้อมูลผ่าน PostgREST
      const response = await fetch("http://localhost:3333/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Failed to save message: ${response.status} ${response.statusText}`);
      }

      // ส่งข้อความไปยังไคลเอนต์อื่น
      io.emit("new_message", message);
    } catch (error) {
      console.error("Error saving message:", error.message);
    }
  });

  // จัดการเมื่อผู้ใช้ตัดการเชื่อมต่อ
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
