#!/usr/bin/env node

import { TolgeeService } from "../services/tolgee.service";
import fs from "fs-extra";
import path from "path";

/**
 * JSON 객체에서 null 값을 빈 문자열로 변환하는 함수
 */
function convertNullToEmptyString(obj: any): any {
  if (obj === null) {
    return "";
  }

  if (Array.isArray(obj)) {
    return obj.map(convertNullToEmptyString);
  }

  if (typeof obj === "object" && obj !== null) {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = convertNullToEmptyString(obj[key]);
      }
    }
    return result;
  }

  return obj;
}

/**
 * JSON 파일 내용을 포맷팅하는 함수
 */
function formatJsonContent(jsonContent: Record<string, any>): string {
  // null 값을 빈 문자열로 변환
  const processedContent = convertNullToEmptyString(jsonContent);
  return JSON.stringify(processedContent, null, 2);
}

/**
 * 모든 JSON 파일을 처리하는 함수
 */
export async function processAllFiles(
  files: Array<{ name: string; path: string }>,
  outputDir: string
): Promise<string[]> {
  const resultFiles: string[] = [];

  for (const file of files) {
    try {
      // JSON 파일 내용 읽기
      const jsonFile = await fs.readFile(file.path, "utf-8");
      const jsonContent = JSON.parse(jsonFile);

      // JSON 포맷팅
      const content = formatJsonContent(jsonContent);

      // 파일명에서 확장자 제거하고 새 확장자 추가
      const fileName = path.parse(file.name).name;
      const outputPath = path.join(outputDir, `${fileName}.json`);

      // 원본 JSON 파일 제거
      await fs.remove(file.path);

      // 포맷팅된 JSON 파일 저장
      await fs.writeFile(outputPath, content + "\n");

      resultFiles.push(outputPath);
    } catch (error) {
      console.error(`파일 처리 중 오류 발생 (${file.name}):`, error);
    }
  }

  return resultFiles;
}

/**
 * JSON 파일을 pull하는 메인 함수
 */
export async function pullJson(
  tolgee: TolgeeService,
  options: {
    outputDir: string;
    projectId: string;
    tags: string;
    excludeTags: string;
  }
) {
  const { files } = await tolgee.extractAndSaveFiles({
    outputDir: options.outputDir,
    projectId: options.projectId,
    tags: options.tags,
    excludeTags: options.excludeTags,
  });

  // 모든 파일 처리
  const resultFiles = await processAllFiles(files, options.outputDir);

  return resultFiles;
}
