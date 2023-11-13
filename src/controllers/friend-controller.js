const { Op } = require("sequelize");
const { Friend } = require("../models");
const createError = require("../utils/create-error");
const { FRIEND_PENDING, FRIEND_ACCEPTED } = require("../config/constant");

exports.requestFriend = async (req, res, next) => {
  try {
    // ดูว่าเป็นเพื่อนกันแล้วยัง (ถ้าเป็นแล้วจะขออีกไม่ได้)
    // SELECT * FROM friends WHERE
    // requester_id = userId AND accepterId = req.user.id
    // OR requester_id = req.user.id AND accepterId = userId

    //เป็นเพื่อนกับตัวเองไม่ได้
    if (req.user.id === +req.params.userId) {
      createError("cannot request yourself", 400);
    }

    const existFriend = await Friend.findOne({
      where: {
        [Op.or]: [
          { requesterId: req.params.userId, accepterId: req.user.id },
          { requesterId: req.user.id, accepterId: req.params.userId },
        ],
      },
    });

    if (existFriend) {
      createError("already friend or pending", 400);
    }

    await Friend.create({
      requesterId: req.user.id, //คนที่login
      accepterId: req.params.userId, //หน้าโปรไฟล์ที่ดูอยู่
      status: FRIEND_PENDING,
    });
    res.status(200).json({ message: "success friend request" });
  } catch (err) {
    next(err);
  }
};

exports.acceptFriend = async (req, res, next) => {
  try {
    // UPDATE users SET status="ACCEPTED"
    // WHERE requester_id = req.params.requesterId
    // AND accepterId = req.user.id
    const [totalRowUpdated] = await Friend.update(
      { status: FRIEND_ACCEPTED },
      {
        where: {
          requesterId: req.params.requesterId, // คนที่ขอ request มา
          accepterId: req.user.id, // คนที่ log in อยู่
        },
      }
    );
    if (totalRowUpdated === 0) {
      createError("this user not sent request to you", 400);
    }
    res.status(200).json({ message: "success add friend" });
  } catch (err) {
    next(err);
  }
};

exports.deleteFriend = async (req, res, next) => {
  try {
    // DELETE FROM friends
    // WHERE requester_id = req.params.friendId AND accepter_id = req.user.id
    // OR requester_id = req.user.id AND accepter_id = req.params.friendId
    const totalDelete = await Friend.destroy({
      where: {
        [Op.or]: [
          { requesterId: req.params.friendId, accepterId: req.user.id },
          { requesterId: req.user.id, accepterId: req.params.friendId },
        ],
      },
    });

    if (totalDelete === 0) {
      createError("You do not have relationship with this friend", 400);
    }

    res.status(204).json();
  } catch (err) {
    next(err);
  }
};

exports.getFriendRequestData = async (req, res, next) => {
  try {
    const requestData = await Friend.findOne({
      where: {
        status: FRIEND_PENDING,
        accepterId: req.user.id,
      },
    });
    res.status(200).json({ requestData });
  } catch (err) {
    next(err);
  }
};
