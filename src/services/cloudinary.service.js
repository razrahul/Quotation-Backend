const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadQuoteAssetToCloudinary(file, assetKind) {
  if (!file || !file.buffer) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "Qutations",
        resource_type: "image",
        public_id: `${assetKind}-${Date.now()}`,
      },
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          provider: "cloudinary",
          metadata: {
            originalName: file.originalname,
            mimetype: file.mimetype,
            bytes: file.size,
            width: result.width,
            height: result.height,
            format: result.format,
          },
        });
      }
    );

    uploadStream.end(file.buffer);
  });
}

async function deleteCloudinaryAsset(publicId) {
  if (!publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
  } catch (error) {
    console.error("[cloudinary] destroy failed:", error?.message || error);
  }
}

module.exports = {
  cloudinary,
  uploadQuoteAssetToCloudinary,
  deleteCloudinaryAsset,
};
