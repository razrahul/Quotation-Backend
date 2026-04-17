declare module "multer" {
  import { RequestHandler } from "express";

  namespace multer {
    export type FileFilterCallback = (error: Error | null, acceptFile?: boolean) => void;
  }

  type MulterField = {
    name: string;
    maxCount?: number;
  };

  type MulterOptions = {
    storage?: unknown;
    fileFilter?: (
      req: Express.Request,
      file: Express.Multer.File,
      cb: multer.FileFilterCallback
    ) => void;
    limits?: {
      fileSize?: number;
      files?: number;
    };
  };

  type MulterInstance = {
    fields(fields: MulterField[]): RequestHandler;
  };

  function multer(options?: MulterOptions): MulterInstance;
  namespace multer {
    function memoryStorage(): unknown;
  }

  export = multer;
}

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
      }
    }

    interface Request {
      files?:
        | {
            [fieldname: string]: Multer.File[];
          }
        | Multer.File[];
    }
  }
}

export {};
