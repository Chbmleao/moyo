export type StorageRepository = {
  uploadFile(
    bucket: string,
    path: string,
    body: Buffer,
    contentType: string
  ): Promise<string>;
  createSignedUrl(bucket: string, path: string, expiresInSeconds?: number): Promise<string>;
};
