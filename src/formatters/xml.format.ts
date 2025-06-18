#!/usr/bin/env node

import { Command, program } from "commander";
import { TolgeeService } from "../services/tolgee.service";
import {
  escapeQuote,
  includesFormatStringMoreThanOne,
  includesHtmlTag,
} from "../utils/string.utils";
import { js2xml } from "xml-js";
import fs from "fs-extra";
import path from "path";
import { SupportedFormat, supportedFormats } from "../types";
/**
 * JSON 파일을 XML로 변환하는 함수
 */
function convertJsonToXml(jsonContent: Record<string, any>): string {
  const result = Object.entries(jsonContent)
    .filter(([key, value]) => typeof value === "string")
    .map(([key, value]) => [key, value as string])
    .map(([key, value]) => [key, escapeQuote(value as string)])
    .map(([key, value]) => {
      let v:
        | {
            _cdata: string;
          }
        | {
            _text: string;
          } = { _text: value };

      if (includesHtmlTag(value)) {
        v = { _cdata: value };
      }

      return {
        _attributes: {
          name: key,
          formatted: includesFormatStringMoreThanOne(value)
            ? "false"
            : undefined,
        },
        ...v,
      };
    });

  const xml = js2xml(
    {
      _declaration: {
        _attributes: {
          version: "1.0",
          encoding: "UTF-8",
        },
      },
      resources: {
        string: result,
      },
    },
    {
      compact: true,
      spaces: 2,
    }
  );

  return xml;
}

/**
 * 모든 파일을 처리하는 함수
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

      // 지정된 포맷으로 변환
      const content = convertJsonToXml(jsonContent);

      // 파일명에서 확장자 제거하고 새 확장자 추가
      const fileName = path.parse(file.name).name;
      const outputPath = path.join(outputDir, `${fileName}.xml`);

      // 변환된 파일 저장
      await fs.writeFile(outputPath, content);

      // 원본 JSON 파일 제거
      await fs.remove(file.path);

      resultFiles.push(outputPath);
    } catch (error) {
      console.error(`파일 처리 중 오류 발생 (${file.name}):`, error);
    }
  }

  return resultFiles;
}
export async function pullXml(
  tolgee: TolgeeService,
  options: {
    outputDir: string;
    projectId: string;
  }
) {
  const { files } = await tolgee.extractAndSaveFiles({
    outputDir: options.outputDir,
    projectId: options.projectId,
  });

  // 모든 파일 처리
  const resultFiles = await processAllFiles(files, options.outputDir);

  return resultFiles;
}
