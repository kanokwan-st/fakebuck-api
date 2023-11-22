const { Comment, User } = require("../models");
const { validateCreateComment } = require("../validators/comment-validators");

exports.createComment = async (req, res, next) => {
  try {
    const newcomment = await Comment.create({
      title: req.body.title,
      postId: req.params.postId,
      userId: req.user.id,
    });
    const comment = await Comment.findOne({
      where: { id: newcomment.id },
      include: { model: User },
    });
    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
};
