// src/api/chatService.js
import axios from "../axiosConfig";

export const getChats = async () => {
  const response = await axios.get("/chats");
  return response.data;
};
