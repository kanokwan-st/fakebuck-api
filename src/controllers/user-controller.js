const fs = require("fs");
const { Op } = require("sequelize");
const {
  FRIEND_ACCEPTED,
  STATUS_ME,
  STATUS_UNKNOWN,
  STATUS_FRIEND,
  STATUS_ACCEPTER,
  STATUS_REQUESTER,
} = require("../config/constant");
const { User, Friend } = require("../models");
const createError = require("../utils/create-error");
const cloudinary = require("../utils/cloudinary");

exports.getUserInfoById = async (req, res, next) => {
  try {
    /* ข้อมูลของเจ้าของหน้า profile */
    const user = await User.findOne({
      where: {
        id: req.params.userId,
      },
      attributes: {
        exclude: ["password"], //ไม่ต้องเอา password มา
      },
    });

    if (!user) {
      createError("user with this id is not found", 400);
    }

    // SELECT * FROM friends WHERE status = 'ACCEPTED'
    // AND (requrester_id = req.params.userId OR
    // accepter_id = req.params.userId)
    // result
    // [{ id, status, requesterId, accepterId, createdAt, updateAt }]
    const userFriends = await Friend.findAll({
      where: {
        status: FRIEND_ACCEPTED,
        [Op.or]: [
          { requesterId: req.params.userId },
          { accepterId: req.params.userId },
        ],
      },
      // ไปเอาข้อมูล user มา
      include: [
        { model: User, as: "Requester", attributes: { exclude: ["password"] } },
        { model: User, as: "Accepter", attributes: { exclude: ["password"] } },
      ],
    });

    /* ข้อมูลเพื่อนของเจ้าของหน้า profile */
    const friends = userFriends.map((el) =>
      el.requesterId === +req.params.userId ? el.Accepter : el.Requester
    );

    // ดูว่าเป็นเพื่อนกันมั้ย
    // SELECT * FROM friends
    // WHERE requester_id = req.user.id AND acceptor_id = req.params.userId
    // OR requester_id = req.user.id AND acceptor_id = req.params.userId
    // "req.user.id คือคนที่กำลัง log in " ,,, "req.params.userId คือคนที่เป็นเจ้าของ profile"

    /* ข้อมูลว่าเจ้าของ profile เป็นอะไรกับ user */
    let statusWithAuthUser;

    // เช็คว่าคน log in เป็นคนเดียวกับเจ้าของโปรไฟล์ไหม
    if (req.user.id === +req.params.userId) {
      statusWithAuthUser = STATUS_ME;
    } else {
      // หาว่าเป็นเพื่อนกันไหม
      const existFriend = await Friend.findOne({
        where: {
          [Op.or]: [
            { requesterId: req.params.userId, accepterId: req.user.id },
            { requesterId: req.user.id, accepterId: req.params.userId },
          ],
        },
      });
      if (!existFriend) {
        // ถ้าหาไม่เจอ
        statusWithAuthUser = STATUS_UNKNOWN;
      } else if (existFriend.status === FRIEND_ACCEPTED) {
        // ถ้ามีสถานะ accepted
        statusWithAuthUser = STATUS_FRIEND;
      } else if (existFriend.requesterId === req.user.id) {
        // ถ้าคนที่ log in เป็นคน request
        statusWithAuthUser = STATUS_ACCEPTER;
      } else {
        statusWithAuthUser = STATUS_REQUESTER;
      }
    }

    res.status(200).json({
      user, //ข้อมูลของเจ้าของหน้า profile
      friends, //เพื่อนของเจ้าของหน้า profile
      statusWithAuthUser, //เจ้าของหน้า profile เป็นอะไรกับ user
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfileImage = async (req, res, next) => {
  try {
    let value;
    const { profileImage, coverImage } = req.user;
    const profilePublicId = profileImage
      ? cloudinary.getPublicId(profileImage)
      : null;
    const coverPublicId = coverImage
      ? cloudinary.getPublicId(coverImage)
      : null;

    if (!req.files.profileImage && !req.files.coverImage) {
      //ไม่มีทั้งคู่
      createError("profile image or cover image is required");
    } else if (req.files.profileImage && req.files.coverImage) {
      //มีทั้งคู่
      const [profileImage, coverImage] = await Promise.all([
        cloudinary.upload(req.files.profileImage[0].path, profilePublicId),
        cloudinary.upload(req.files.coverImage[0].path, coverPublicId),
      ]);
      value = { profileImage, coverImage };
    } else if (req.files.profileImage) {
      //มีอันเดียว
      const profileImage = await cloudinary.upload(
        req.files.profileImage[0].path,
        profilePublicId
      );
      value = { profileImage };
    } else {
      //มีอันเดียว
      const coverImage = await cloudinary.upload(
        req.files.coverImage[0].path,
        coverPublicId
      );
      value = { coverImage };
    }

    await User.update(value, { where: { id: req.user.id } });
    res.status(200).json(value);
  } catch (err) {
    next(err);
  } finally {
    //ลบไฟล์ภาพ
    if (req.files.profileImage) {
      fs.unlinkSync(req.files.profileImage[0].path);
    }
    if (req.files.coverImage) {
      fs.unlinkSync(req.files.coverImage[0].path);
    }
  }
};
