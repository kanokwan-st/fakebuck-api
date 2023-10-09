module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define(
    "Comment",
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
    },
    { underscored: true }
  );

  Comment.associate = (db) => {
    Comment.belongsTo(db.User, {
      foreignKey: {
        name: "userId",
        allowNull: false,
      },
      onDelete: "RESTRICT", //ห้ามลบ
    });

    Comment.belongsTo(db.Post, {
      foreignKey: {
        name: "postId",
        allowNull: false,
      },
      onDelete: "RESTRICT", //ห้ามลบ
    });
  };

  return Comment;
};
