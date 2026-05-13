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

  private async getFile(parentFolderName: string, targetFileName: string) {
    const { data: filesList } = await this.driveClient.files.list({
      q: `'${PARENT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and name='${parentFolderName}'`,
    });

    if (!filesList.files || filesList.files?.length === 0) {
      this.logger.error(`Folder ${parentFolderName} not found in Google Drive`);
      throw new Error(`Folder ${parentFolderName} not found in Google Drive`);
    }

    const { id: folderId } = filesList.files[0];
    const { data: matchingFiles } = await this.driveClient.files.list({
      q: `'${folderId}' in parents and name='${targetFileName}' and mimeType != 'application/vnd.google-apps.folder'`,
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
      fields: 'id, name, contentHints, mimeType',
      alt: 'media',
    });

    return { id: targetFileId, name, content, parentFolderId: folderId };
  }

  private async overwriteFile(
    file: { id: string; name: string; content: string; parentId: string },
    newContent: string,
  ) {
    await this.driveClient.files.create({
      requestBody: {
        name: file.name,
        parents: [file.parentId],
        mimeType: 'text/markdown',
      },
      media: {
        mimeType: 'text/markdown',
        body: newContent,
      },
    });

    await this.driveClient.files.delete({
      fileId: file.id,
    });
  }

  async getFileContent(filePath: string): Promise<string> {
    this.logger.log(`Fetching content for file ${filePath} from Google Drive`);

    const [folderName, fileName] = filePath.split('/');
    const file = await this.getFile(folderName, fileName);

    this.logger.log({ file });

    return file.content as string;
  }

  async uploadFileContent(filePath: string, content: string): Promise<void> {
    this.logger.log(
      `Mock: Uploading content for file ${filePath} to Google Drive`,
    );

    const [folderName, fileName] = filePath.split('/');
    const file = await this.getFile(folderName, fileName);
    await this.overwriteFile(
      {
        id: file.id!,
        name: file.name!,
        content: file.content as string,
        parentId: file.parentFolderId!,
      },
      content,
    );

    return;
  }
}
