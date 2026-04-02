import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(CURRENT_DIR, '../../../');

export const DATA_ROOT = path.join(APP_ROOT, 'data', 'projects');

export function getProjectDataPath(projectId: string, ...segments: string[]) {
  return path.join(DATA_ROOT, projectId, ...segments);
}
