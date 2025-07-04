#!/usr/bin/env node

import { Command } from "commander";
import path from "path";

import { TolgeeService } from "./services/tolgee.service";
import { supportedFormats } from "./types";
import { pullXml } from "./formatters/xml.format";
import { pullJson } from "./formatters/json.format";

const program = new Command();

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

    const tags = options.tags;
    const excludeTags = options.excludeTags;

    console.log(tags, excludeTags);

    // TolgeeService 인스턴스 생성
    const tolgee = new TolgeeService({
      apiKey: options.apiKey,
      apiUrl: options.apiUrl,
    });

    let resultFiles: string[] = [];

    switch (options.format) {
      case "XML":
        resultFiles = await pullXml(tolgee, {
          outputDir: options.path,
          projectId: options.projectId,
          tags,
          excludeTags,
        });
        break;
      case "JSON":
        resultFiles = await pullJson(tolgee, {
          outputDir: options.path,
          projectId: options.projectId,
          tags,
          excludeTags,
        });
        break;
      default:
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
  .option("--api-key <apiKey>", "Tolgee API Key")
  .option("--project-id <projectId>", "Tolgee Project ID")
  .option("--api-url [apiUrl]", "Tolgee Base URL", "https://app.tolgee.io")
  .option("--format [format]", "Output format (XML, JSON)", "JSON")
  .option("--path [path]", "Output Directory", "i18n")
  .option("--tags [tags]", "Tags to filter")
  .option("--exclude-tags [excludeTags]", "Exclude Tags");

program.parse(process.argv);
