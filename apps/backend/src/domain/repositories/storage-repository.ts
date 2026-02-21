export type StorageRepository = {
	uploadFile(bucket: string, path: string, body: Buffer, contentType: string): Promise<string>;
	downloadFile(bucket: string, path: string): Promise<Buffer>;
	createSignedUrl(bucket: string, path: string, expiresInSeconds?: number): Promise<string>;
};
