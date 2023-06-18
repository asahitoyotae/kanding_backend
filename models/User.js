const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  role: { type: String },
  content: { type: String },
});

const prevChatSchema = new mongoose.Schema({
  chat_id: { type: String },
  title: { type: String },
  conv: [chatSchema],
});

const schema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    max: 100,
  },
  email: {
    type: String,
    required: true,
    max: 100,
  },
  password: {
    type: String,
    required: true,
    min: 12,
    max: 100,
  },
  refresh: {
    type: String,
    default: null,
  },
  is_valid_user: {
    type: String,
    default: false,
  },
  prev_chats: [prevChatSchema],
  data_registred: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("User", schema);

//prev_chat constructions
// prev_chat = [
//   {
//     id: 234234234234,
//     title: "must be a string",
//     chat: [
//       { role: "user", content: "questions by users" },
//       { role: "assistant", content: "assistant reply" },
//     ],
//   },
//   {
//     id: 234345345234,
//     title: "must be a string",
//     chat: [
//       { role: "user", content: "questions by users" },
//       { role: "assistant", content: "assistant reply" },
//     ],
//   },
// ];
