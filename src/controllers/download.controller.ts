import { Request, Response } from "express";
import DownloadLog  from "../models/download.model";
import { AuthRequest } from "../middleware/auth.middleware";
import { success, error } from "../utils/response";


export async function GetDownloadLog(req: AuthRequest, res: Response) {
    try {
        if(!req.userId) return error(res, "Login required", 401);

        const downloadLog = await DownloadLog.findAll({
            where: {userId : req.userId},
            order: [["downloadedAt", "DESC"]],
        })

        //TODO: add DownloadLog with association quatation and user

        return success(res, "DownLoads Logs Faetched", downloadLog);

    } catch (err : any) {
        return error(res, err.message, 500);
    }
}
