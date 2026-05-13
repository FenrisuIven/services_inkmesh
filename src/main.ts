import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentsModule } from './services/documents/documents.module';
import { ProjectsModule } from './services/projects/projects.module';
import { DraftsModule } from './services/drafts/drafts.module';
import { UsersModule } from './services/users/users.module';
import { CharactersModule } from './services/characters/characters.module';
import { SERVICE_PORTS } from './config/ports';
import { AllExceptionsRpcFilter } from './filters/rpc.exception.filter';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrapService(
  module: any,
  port: number,
  serviceName: string,
) {
  try {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
      module,
      {
        transport: Transport.TCP,
        options: {
          host: '0.0.0.0',
          port: port,
        },
      },
    );
    app.useGlobalFilters(new AllExceptionsRpcFilter());
    await app.listen();
    console.log(`[${serviceName} Service] listening on TCP port ${port}`);
  } catch (error) {
    console.error(`Failed to start ${serviceName} service:`, error);
  }
}

async function bootstrap() {
  console.log('Starting Inkmesh Microservices monolith...');

  await Promise.all([
    bootstrapService(DocumentsModule, SERVICE_PORTS.DOCUMENTS, 'Documents'),
    bootstrapService(ProjectsModule, SERVICE_PORTS.PROJECTS, 'Projects'),
    bootstrapService(DraftsModule, SERVICE_PORTS.DRAFTS, 'Drafts'),
    bootstrapService(UsersModule, SERVICE_PORTS.USERS, 'Users'),
    bootstrapService(CharactersModule, SERVICE_PORTS.CHARACTERS, 'Characters'),
  ]);

  console.log('All microservices initialized.');
}

bootstrap();
