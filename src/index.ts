#!/usr/bin/env node

import { Command } from "commander";
import { TolgeeService } from "./services/tolgee.service";
import {
  escapeQuote,
  includesFormatStringMoreThanOne,
  includesHtmlTag,
} from "./utils/string.utils";
import { js2xml } from "xml-js";
import fs from "fs-extra";
import path from "path";
import { supportedFormats } from "./types";
import { pullXml } from "./formatters/xml.format";

const program = new Command();

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

program
  .version("1.0.0")
  .description("Tolgee CLI tool for managing translations");

program
  .command("pull")
  .description("Pull translations from Tolgee")
  .action(async () => {
    const options = program.opts();

    // 필수 옵션 확인
    if (!options.apiKey) {
      console.error(
        "API Key가 필요합니다. -a 또는 --apiKey 옵션을 사용해주세요."
      );
      process.exit(1);
    }

    if (!options.projectId) {
      console.error(
        "Project ID가 필요합니다. -p 또는 --projectId 옵션을 사용해주세요."
      );
      process.exit(1);
    }

    // 포맷 검증
    if (!supportedFormats.includes(options.format)) {
      console.error(`지원하지 않는 포맷입니다: ${options.format}`);
      console.error(`지원하는 포맷: ${supportedFormats.join(", ")}`);
      process.exit(1);
    }

    // TolgeeService 인스턴스 생성
    const tolgee = new TolgeeService({
      apiKey: options.apiKey,
      baseUrl: options.baseUrl,
    });

    let resultFiles: string[] = [];

    switch (options.format) {
      case "xml":
        resultFiles = await pullXml(tolgee, {
          outputDir: options.outputDir,
          projectId: options.projectId,
        });
        break;
    }

    // 결과 출력
    console.group(`${resultFiles.length}개 파일 추출 완료`);
    resultFiles.forEach((file) => {
      const relativePath = path.relative(process.cwd(), file);
      console.log(`${relativePath}`);
    });
    console.groupEnd();
  });

program
  .option("-a, --apiKey <apiKey>", "Tolgee API Key")
  .option("-p, --projectId <projectId>", "Tolgee Project ID")
  .option("-b, --baseUrl [baseUrl]", "Tolgee Base URL", "https://app.tolgee.io")
  .option("-f, --format [format]", "Output format (xml)", "xml")
  .option("-o, --outputDir [outputDir]", "Output Directory", "i18n");

program.parse(process.argv);
