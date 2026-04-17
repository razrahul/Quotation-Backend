import { Request } from "express";
const multer = require("multer");

const storage = multer.memoryStorage();

function imageFileFilter(
  req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile?: boolean) => void
) {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
    return;
  }

  cb(new Error("Only image files are allowed"));
}

export const quoteUpload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 2,
  },
});

export const quoteUploadFields = quoteUpload.fields([
  { name: "companyLogo", maxCount: 1 },
  { name: "signature", maxCount: 1 },
]);
