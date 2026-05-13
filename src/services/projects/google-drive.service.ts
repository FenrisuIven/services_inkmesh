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

  async createProjectFolder(ownerId: string, projectId: string): Promise<string> {
    const folderName = `${ownerId}|${projectId}`;
    this.logger.log(`Creating project folder: ${folderName}`);

    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [PARENT_FOLDER_ID],
    };

    try {
      const response = await this.driveClient.files.create({
        requestBody: fileMetadata,
        fields: 'id',
      });
      return response.data.id!;
    } catch (error) {
      this.logger.error(`Failed to create project folder ${folderName}: ${error.message}`);
      throw error;
    }
  }

  private async findFolderByName(folderName: string): Promise<string | null> {
    try {
      const response = await this.driveClient.files.list({
        q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and '${PARENT_FOLDER_ID}' in parents and trashed = false`,
        fields: 'files(id, name)',
      });

      const files = response.data.files;
      if (files && files.length > 0) {
        return files[0].id!;
      }
      return null;
    } catch (error) {
      this.logger.error(`Error finding folder ${folderName}: ${error.message}`);
      return null;
    }
  }

  async deleteProjectFolder(folderName: string): Promise<void> {
    this.logger.log(`Deleting project folder: ${folderName}`);
    const folderId = await this.findFolderByName(folderName);

    if (!folderId) {
      this.logger.warn(`Project folder ${folderName} not found for deletion`);
      return;
    }

    try {
      await this.driveClient.files.delete({
        fileId: folderId,
      });
    } catch (error) {
      this.logger.error(`Failed to delete project folder ${folderName}: ${error.message}`);
      throw error;
    }
  }

  async renameProjectFolder(oldName: string, newName: string): Promise<void> {
    this.logger.log(`Renaming project folder from ${oldName} to ${newName}`);
    const folderId = await this.findFolderByName(oldName);

    if (!folderId) {
      this.logger.error(`Project folder ${oldName} not found for renaming`);
      throw new Error(`Folder ${oldName} not found`);
    }

    try {
      await this.driveClient.files.update({
        fileId: folderId,
        requestBody: {
          name: newName,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to rename project folder ${oldName}: ${error.message}`);
      throw error;
    }
  }
}
