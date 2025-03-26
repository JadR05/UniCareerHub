  const Question = require('../model/Questions');
  const crypto = require('crypto');
  const {logEvents} = require('../middleware/logEvents')

  const postQuestion = async (req, res) => {
    const postId = crypto.randomUUID();
    const { title, question } = req.body;
    const user = req.user.username;
    const newQuestion = new Question({
      username: user,
      ID: postId,
      title,
      question,
      time: new Date(), 
    });
    await newQuestion.save();
    return res.status(200).json({ message: 'Question posted successfully' });
  };

  const getLatestQuestions = async (req, res) => {
    try {
      const latestQuestions = await Question.find().sort({ time: -1 }).limit(10);
      res.status(200).json(latestQuestions);
    } catch (error) {
      console.error(error);
      logEvents(`${error.name}: ${error.message}`, 'errLog.txt');
      res.status(500).send("Server error");
    }
  };

  const handleReply = async (req, res) => {
    const { ID, reply } = req.body;
    const user = req.user.username;
    const replyTime = new Date();
    
    const question = await Question.findOne({ ID });
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    if (!question.replies) {
      question.replies = [];
    }
    question.replies.push({ user, reply, time: replyTime });
    await question.save();
    return res.status(200).json({ message: 'Reply posted successfully' });
  };

  const editQuestion = async (req, res) => {
    try {
      const questionId = req.params.id;
      const { title, question } = req.body;
      const updated = await Question.findOneAndUpdate(
        { ID: questionId },
        { title, question },
        { new: true }
      );
      if (!updated) {
        return res.status(404).json({ error: 'Question not found' });
      }
      res.json({ message: 'Question updated successfully', question: updated });
    } catch (error) {
      console.error(error);
      logEvents(`${error.name}: ${error.message}`, 'errLog.txt');
      res.status(500).json({ error: 'Server error' });
    }
  };

  const removeQuestion = async (req, res) => {
    try {
      const questionId = req.params.id;
      const deletion = await Question.deleteOne({ ID: questionId });
      if (deletion.deletedCount === 0) {
        return res.status(404).json({ error: 'Question not found' });
      }
      res.json({ message: 'Question removed successfully' });
    } catch (error) {
      console.error(error);
      logEvents(`${error.name}: ${error.message}`, 'errLog.txt');
      res.status(500).json({ error: 'Server error' });
    }
  };
  const approveQuestion = async (req, res) => {
    try {
      const questionId = req.params.id;
      const updated = await Question.findOneAndUpdate(
        { ID: questionId },
        { flagged: false, flagCount: 0, flaggedBy: [] },
        { new: true }
      );
      if (!updated) {
        return res.status(404).json({ error: 'Question not found' });
      }
      res.json({ message: 'Question approved (flags reset)', question: updated });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  };

  const flagQuestion = async (req, res) => {
    try {
      const questionId = req.params.id;
      const reporter = req.user.username;
      const question = await Question.findOne({ ID: questionId });
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }
      if (!question.flaggedBy.includes(reporter)) {
        question.flaggedBy.push(reporter);
        question.flagCount = question.flaggedBy.length;
        question.flagged = true;
        await question.save();
      }
      res.json({ message: 'Question flagged', question });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  };

  const editReply = async (req, res) => {
    try {
      const replyId = req.params.id;
      const { reply: newReplyText } = req.body;
      const result = await Question.updateOne(
        { "replies._id": replyId },
        { $set: { "replies.$.reply": newReplyText, "replies.$.time": new Date() } }
      );
      if (result.nModified === 0) {
        return res.status(404).json({ error: 'Reply not found' });
      }
      res.json({ message: 'Reply updated successfully' });
    } catch (error) {
      console.error(error);
      logEvents(`${error.name}: ${error.message}`, 'errLog.txt');
      res.status(500).json({ error: 'Server error' });
    }
  };

  const removeReply = async (req, res) => {
    try {
      const replyId = req.params.id;
      const result = await Question.updateOne(
        { "replies._id": replyId },
        { $pull: { replies: { _id: replyId } } }
      );
      if (result.nModified === 0) {
        return res.status(404).json({ error: 'Reply not found' });
      }
      res.json({ message: 'Reply removed successfully' });
    } catch (error) {
      console.error(error);
      logEvents(`${error.name}: ${error.message}`, 'errLog.txt');
      res.status(500).json({ error: 'Server error' });
    }
  };

  const flagReply = async (req, res) => {
    try {
      const replyId = req.params.id;
      const result = await Question.updateOne(
        { "replies._id": replyId },
        { $set: { "replies.$.flagged": true } }
      );
      if (result.nModified === 0) {
        return res.status(404).json({ error: 'Reply not found' });
      }
      res.json({ message: 'Reply flagged successfully' });
    } catch (error) {
      console.error(error);
      logEvents(`${error.name}: ${error.message}`, 'errLog.txt');
      res.status(500).json({ error: 'Server error' });
    }
  };

  const getReply = async (req, res) => {
    try {
      const replyId = req.params.id;
      const question = await Question.findOne({ "replies._id": replyId }, { "replies.$": 1 });
      if (!question || !question.replies.length) {
        return res.status(404).json({ error: 'Reply not found' });
      }
      res.json(question.replies[0]);
    } catch (error) {
      console.error(error);
      logEvents(`${error.name}: ${error.message}`, 'errLog.txt');
      res.status(500).json({ error: 'Server error' });
    }
  };

  const getQuestion = async (req, res) => {
    try {
      const questionId = req.params.id;
      const question = await Question.findOne({ ID: questionId });
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }
      res.json(question);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  };
  const approveReply = async (req, res) => {
    try {
      const replyId = req.params.id;
      const result = await Question.updateOne(
        { "replies._id": replyId },
        { $set: { "replies.$.flagged": false } }
      );
      if (result.nModified === 0) {
        return res.status(404).json({ error: 'Reply not found' });
      }
      res.json({ message: 'Reply approved (flag reset)' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  };
  const toggleUpvoteReply = async (req, res) => {
    try {
      const replyId = req.params.id;
      const username = req.user.username;
      // Find the question that contains the reply
      const question = await Question.findOne({ "replies._id": replyId });
      if (!question) {
        return res.status(404).json({ error: "Reply not found" });
      }
      // Get the reply subdocument using Mongoose's id() method
      const reply = question.replies.id(replyId);
      if (!reply) {
        return res.status(404).json({ error: "Reply not found" });
      }
      // If the user already upvoted, remove the upvote; otherwise, add it.
      if (reply.upvotedBy && reply.upvotedBy.includes(username)) {
        // Remove user's upvote
        reply.upvotes = Math.max((reply.upvotes || 0) - 1, 0);
        reply.upvotedBy = reply.upvotedBy.filter(u => u !== username);
      } else {
        // Add user's upvote
        reply.upvotes = (reply.upvotes || 0) + 1;
        if (!reply.upvotedBy) {
          reply.upvotedBy = [];
        }
        reply.upvotedBy.push(username);
      }
      await question.save();
      return res.json({ message: "Reply upvote toggled successfully", upvotes: reply.upvotes });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Server error" });
    }
  };
  
  

  module.exports = {postQuestion,getLatestQuestions,handleReply,editQuestion,removeQuestion,flagQuestion,editReply,removeReply,flagReply,getReply,approveQuestion,getQuestion,approveReply,toggleUpvoteReply
  };
