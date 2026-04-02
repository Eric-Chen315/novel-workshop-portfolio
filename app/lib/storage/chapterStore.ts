import fs from 'fs/promises';
import path from 'path';
import { Chapter } from '../types/chapter';
import { DATA_ROOT } from './dataRoot';

const CHAPTERS_DIR = DATA_ROOT;

export async function getAll(projectId: string): Promise<Chapter[]> {
  const dirPath = path.join(CHAPTERS_DIR, projectId, 'chapters');
  try {
    await fs.mkdir(dirPath, { recursive: true });
    const files = await fs.readdir(dirPath);
    return Promise.all(
      files.map(async (file) => {
        const content = await fs.readFile(path.join(dirPath, file), 'utf-8');
        return JSON.parse(content) as Chapter;
      })
    );
  } catch (err) {
    return [];
  }
}

export async function get(projectId: string, chapterNum: number): Promise<Chapter | null> {
  const filePath = path.join(CHAPTERS_DIR, projectId, 'chapters', `${chapterNum}.json`);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as Chapter;
  } catch (err) {
    return null;
  }
}

export async function save(projectId: string, chapter: Chapter): Promise<void> {
  const dirPath = path.join(CHAPTERS_DIR, projectId, 'chapters');
  await fs.mkdir(dirPath, { recursive: true });
  const filePath = path.join(dirPath, `${chapter.chapterNum}.json`);
  await fs.writeFile(filePath, JSON.stringify(chapter, null, 2));
}

export async function deleteChapter(projectId: string, chapterNum: number): Promise<void> {
  const filePath = path.join(CHAPTERS_DIR, projectId, 'chapters', `${chapterNum}.json`);
  await fs.unlink(filePath);
}