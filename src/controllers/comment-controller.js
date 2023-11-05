const { Comment } = require("../models");
const { validateCreateComment } = require("../validators/comment-validators");

exports.createComment = async (req, res, next) => {
  try {
    const comment = await Comment.create({
        title: req.body.title,
        postId: req.params.postId,
        userId: req.user.id
     });
     res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
};
