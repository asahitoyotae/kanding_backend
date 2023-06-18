const router = require("express").Router();
const access_validator = require("./chatvalidator");
const axios = require("axios");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

router.post("/completion", access_validator, async (req, res) => {
  const url = "https://api.openai.com/v1/chat/completions";
  const headers = {
    "content-type": "application/json",
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  };
  const user_query = req.body.messages;
  const chatId = req.body.chatId;
  const model = req.body.model;
  const body = {
    model: model,
    messages: user_query,
    temperature: 0.7,
    max_tokens: 1000,
  };
  try {
    const user = await User.findOne({ _id: req.user.id });
    if (!user) {
      return res
        .status(403)
        .send({ message: "Access Denied no Id exist", user: req.user });
    }
    const response = await axios.post(url, body, { headers });
    const message = response.data.choices[0].message;
    if (chatId) {
      const prev_chatObject = user.prev_chats.find(
        (chat) => chat.chat_id === chatId
      );
      if (prev_chatObject) {
        prev_chatObject.conv.push(user_query[user_query.length - 1]);
        prev_chatObject.conv.push(message);
        user.markModified("prev_chats");
        await user.save();
      } else {
        user.prev_chats.unshift({
          chat_id: chatId,
          title:
            user_query[1].content.slice(0, 20) +
            (user_query[1].content.length > 20 ? "..." : ""),
          conv: [user_query[1], message],
        });
        user.save();
      }
    } else {
      user.prev_chats.unshift({
        chat_id: response.data.id,
        title:
          user_query[1].content.slice(0, 20) +
          (user_query[1].content.length > 20 ? "..." : ""),
        conv: [user_query[1], message],
      });
      user.save();
    }

    return res.send({
      res: message,
      chat_id: chatId ? chatId : response.data.id,
      title: chatId
        ? null
        : user_query[1].content.slice(0, 20) +
          (user_query[1].content.length > 20 ? "..." : ""),
    });
  } catch (error) {
    return res.status(500).send({
      res: {
        role: "assistant",
        content: "an error occured please try again later",
      },
      chat_id: chatId
        ? chatId
        : `Network_Error-${Math.random() * 100}-${Math.random() * 1000}`,
      title: chatId ? null : user_query[1].content.slice(0, 20) + "...",
    });
  }
});

router.post("/delete", async (req, res) => {
  const token = req.header("auth-token");
  if (!token) {
    return res
      .status(403)
      .send({ success: false, message: "you are not allowed to delete this " });
  }
  jwt.verify(token, process.env.ACCESS_PRIVATE_KEY, async (err, decoded) => {
    if (err) {
      return res.status(403).send(err);
    }
    try {
      const user = await User.findOne({ _id: decoded.id });
      if (!user) {
        return res
          .status(403)
          .send({ message: "invalid token", success: false });
      }
      user.prev_chats = [];
      user.markModified("prev_chats");
      await user.save();
      return res.send({ success: true });
    } catch (error) {
      res.status(403).send({ error: error, success: false });
    }
  });
});

router.post("/single-delete", async (req, res) => {
  const token = req.header("auth-token");
  const chatId = req.body.chat_id;
  if (!token) {
    return res
      .status(403)
      .send({ success: false, message: "you are not allowed to delete this " });
  }
  jwt.verify(token, process.env.ACCESS_PRIVATE_KEY, async (err, decoded) => {
    if (err) {
      return res.status(403).send(err);
    }
    try {
      const user = await User.findOne({ _id: decoded.id });
      if (!user) {
        return res
          .status(403)
          .send({ message: "invalid token", success: false });
      }
      const data = [...user.prev_chats];
      const index = data.findIndex((chat) => chat.chat_id === chatId);
      if (index === -1) {
        return res.status(401).send({
          success: false,
          error: "not found",
          message: "data doesn't exist",
        });
      } else {
        data.splice(index, 1);
        user.prev_chats = data;
        user.markModified("prev_chats");
        await user.save();
        return res.send({ success: true, message: "object deleted" });
      }
    } catch (error) {
      res.status(403).send({ error: error, success: false });
    }
  });
});

module.exports = router;
