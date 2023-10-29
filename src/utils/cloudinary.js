const cloudinary = require('../config/cloudinary');

exports.upload = async (filePath, publicId) => {
    const option = {
        unique_filename: false,
        use_filename: true, //ใช้ชื่อไฟล์จาก backend
        overwrite: true,
    };

    if (publicId) {
        option.public_id = publicId; //เขียนทับชื่อไฟล์เป็นค่าของ publicId
    }

    if (publicId) {
        option.public_id = publicId;
    }

    const result = await cloudinary.uploader.upload(filePath, option);
    return result.secure_url;
};

exports.getPublicId = url => {
    const splitSlash = url.split('/');
    return splitSlash[splitSlash.length - 1].split('.')[0];
};
