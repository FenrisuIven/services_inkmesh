import { Injectable, Logger } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';

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

  private async findFolderByName(folderName: string): Promise<string | null> {
    try {
      const { data: filesList } = await this.driveClient.files.list({
        q: `'${PARENT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed = false`,
        fields: 'files(id, name)',
      });

      if (filesList.files && filesList.files.length > 0) {
        return filesList.files[0].id!;
      }
      return null;
    } catch (error) {
      this.logger.error(`Error finding folder ${folderName}: ${error.message}`);
      return null;
    }
  }

  private async getFile(parentFolderName: string, targetFileName: string) {
    const folderId = await this.findFolderByName(parentFolderName);

    if (!folderId) {
      this.logger.error(`Folder ${parentFolderName} not found in Google Drive`);
      throw new Error(`Folder ${parentFolderName} not found in Google Drive`);
    }

    const { data: matchingFiles } = await this.driveClient.files.list({
      q: `'${folderId}' in parents and name='${targetFileName}' and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
    });

    if (!matchingFiles.files || matchingFiles.files.length === 0) {
      this.logger.error(
        `File ${targetFileName} not found in folder ${parentFolderName}`,
      );
      throw new Error(
        `File ${targetFileName} not found in folder ${parentFolderName}`,
      );
    }
    const { id: targetFileId, name } = matchingFiles.files[0];
    const { data: content } = await this.driveClient.files.get({
      fileId: targetFileId || '',
      fields: 'id, name, mimeType',
      alt: 'media',
    });

    return { id: targetFileId, name, content, parentFolderId: folderId };
  }

  async createEmptyFile(folderName: string, fileName: string): Promise<string> {
    this.logger.log(`Creating empty file ${fileName} in folder ${folderName}`);
    const folderId = await this.findFolderByName(folderName);

    if (!folderId) {
      throw new Error(`Parent folder ${folderName} not found`);
    }

    try {
      const response = await this.driveClient.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
          mimeType: 'text/markdown',
        },
        media: {
          mimeType: 'text/markdown',
          body: '',
        },
        fields: 'id',
      });
      return response.data.id!;
    } catch (error) {
      this.logger.error(`Failed to create file ${fileName}: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(folderName: string, fileName: string): Promise<void> {
    this.logger.log(`Deleting file ${fileName} from folder ${folderName}`);
    const folderId = await this.findFolderByName(folderName);

    if (!folderId) {
      this.logger.warn(`Folder ${folderName} not found for file deletion`);
      return;
    }

    const { data: matchingFiles } = await this.driveClient.files.list({
      q: `'${folderId}' in parents and name='${fileName}' and trashed = false`,
      fields: 'files(id)',
    });

    if (matchingFiles.files && matchingFiles.files.length > 0) {
      try {
        await this.driveClient.files.delete({
          fileId: matchingFiles.files[0].id!,
        });
      } catch (error) {
        this.logger.error(`Failed to delete file ${fileName}: ${error.message}`);
        throw error;
      }
    }
  }

  async getFileContent(filePath: string): Promise<string> {
    this.logger.log(`Fetching content for file ${filePath} from Google Drive`);

    const [folderName, fileName] = filePath.split('/');
    const file = await this.getFile(folderName, fileName);

    return file.content as string;
  }

  async uploadFileContent(filePath: string, content: string): Promise<void> {
    this.logger.log(`Uploading content for file ${filePath} to Google Drive`);

    const [folderName, fileName] = filePath.split('/');
    const file = await this.getFile(folderName, fileName);

    try {
      await this.driveClient.files.update({
        fileId: file.id!,
        media: {
          mimeType: 'text/markdown',
          body: content,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update file ${filePath}: ${error.message}`);
      throw error;
    }
  }
}
