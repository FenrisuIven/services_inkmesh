import { junctionsSchema } from './junctions.schema';

export const projectRoleEnum = junctionsSchema.enum('project_role', [
  'OWNER',
  'MODERATOR',
  'WRITER',
]);
