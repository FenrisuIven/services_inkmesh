import { Injectable, Logger } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

const CREDS = [
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI!,
];
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN!;
const PARENT_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!;

@Injectable()
export class GoogleDriveService {
  private readonly logger: Logger = new Logger(GoogleDriveService.name);
  private readonly driveClient: drive_v3.Drive;

  constructor() {
    const authClient = new google.auth.OAuth2(...CREDS);
    authClient.setCredentials({ refresh_token: REFRESH_TOKEN });
    this.driveClient = google.drive({ version: 'v3', auth: authClient });
  }

  private async getRootCharactersFolder(): Promise<string> {
    const folderName = 'characters';
    const { data: filesList } = await this.driveClient.files.list({
      q: `'${PARENT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed = false`,
      fields: 'files(id)',
    });

    if (filesList.files && filesList.files.length > 0) {
      return filesList.files[0].id!;
    }

    const response = await this.driveClient.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [PARENT_FOLDER_ID],
      },
      fields: 'id',
    });
    return response.data.id!;
  }

  async getOrCreateFolder(characterId: string): Promise<string> {
    const rootFolderId = await this.getRootCharactersFolder();
    
    const { data: filesList } = await this.driveClient.files.list({
      q: `'${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and name='${characterId}' and trashed = false`,
      fields: 'files(id)',
    });

    if (filesList.files && filesList.files.length > 0) {
      return filesList.files[0].id!;
    }

    const response = await this.driveClient.files.create({
      requestBody: {
        name: characterId,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [rootFolderId],
      },
      fields: 'id',
    });
    return response.data.id!;
  }

  async uploadImage(characterId: string, imageId: string, buffer: Buffer, mimetype: string): Promise<string> {
    const folderId = await this.getOrCreateFolder(characterId);

    const readableStream = Readable.from(buffer);

    const response = await this.driveClient.files.create({
      requestBody: {
        name: imageId,
        parents: [folderId],
      },
      media: {
        mimeType: mimetype,
        body: readableStream,
      },
      fields: 'id',
    });

    return response.data.id!;
  }

  async listImages(characterId: string): Promise<{ id: string, name: string }[]> {
    const folderId = await this.getOrCreateFolder(characterId);

    const { data: filesList } = await this.driveClient.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name)',
    });

    return filesList.files?.map(file => ({ id: file.id!, name: file.name! })) || [];
  }

  async deleteImage(characterId: string, imageId: string): Promise<void> {
    // characterId is implicitly handled by the folder structure
    await this.driveClient.files.delete({
      fileId: imageId,
    });
  }

  async downloadImage(imageId: string): Promise<Buffer> {
    const response = await this.driveClient.files.get(
      {
        fileId: imageId,
        alt: 'media',
      },
      { responseType: 'arraybuffer' },
    );

    return Buffer.from(response.data as ArrayBuffer);
  }
}
