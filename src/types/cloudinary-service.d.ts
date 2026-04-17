declare module "../services/cloudinary.service" {
  export function uploadQuoteAssetToCloudinary(
    file: Express.Multer.File,
    assetKind: string
  ): Promise<{
    url: string;
    publicId: string;
    provider: string;
    metadata?: Record<string, unknown>;
  } | null>;

  export function deleteCloudinaryAsset(publicId?: string): Promise<void>;
}
