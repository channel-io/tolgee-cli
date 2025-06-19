import axios, { AxiosInstance } from "axios";
import AdmZip from "adm-zip";
import fs from "fs-extra";
import path from "path";

interface TolgeeServiceOptions {
  apiKey: string;
  baseUrl?: string;
}

class TolgeeService {
  client: AxiosInstance;

  constructor(options: TolgeeServiceOptions) {
    const { apiKey, baseUrl } = options;

    this.client = axios.create({
      baseURL: `${baseUrl}/v2`,
      headers: {
        "X-API-Key": apiKey,
      },
    });
  }

  async exportData(
    projectId: string,
    {
      tags,
      excludeTags,
    }: {
      tags: string;
      excludeTags: string;
    }
  ) {
    const response = await this.client.get(`/projects/${projectId}/export`, {
      responseType: "arraybuffer",
      params: {
        format: "JSON",
        structureDelimiter: "",
        messageFormat: "C_SPRINTF",
        filterTagIn: tags,
        filterTagNotIn: excludeTags,
      },
    });
    return response;
  }

  async extractAndSaveFiles({
    projectId,
    outputDir,
    tags,
    excludeTags,
  }: {
    projectId: string;
    outputDir: string;
    tags: string;
    excludeTags: string;
  }) {
    try {
      const response = await this.exportData(projectId, {
        tags,
        excludeTags,
      });

      // zip 데이터를 Buffer로 변환
      const zipBuffer = Buffer.from(response.data);

      // 임시 폴더 및 출력 폴더 생성
      const extractDir = path.join(process.cwd(), outputDir);

      await fs.ensureDir(extractDir);

      // zip 파일을 임시로 저장
      const zipPath = path.join(extractDir, "export.zip");
      await fs.writeFile(zipPath, zipBuffer);

      // zip 파일 해체
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(extractDir, true);

      // get file names
      const fileNames = zip.getEntries().map((entry) => entry.name);

      // 해체된 파일들 목록 수집 및 출력
      const fileInfo: Array<{ name: string; path: string; content?: string }> =
        [];

      for (const file of fileNames) {
        const filePath = path.join(extractDir, file);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
          const subFiles = await fs.readdir(filePath);
          for (const subFile of subFiles) {
            fileInfo.push({
              name: `${file}/${subFile}`,
              path: path.join(filePath, subFile),
            });
          }
        } else {
          const info: { name: string; path: string; content?: string } = {
            name: file.replace(".json", ""),
            path: filePath,
          };

          fileInfo.push(info);
        }
      }

      // 임시 파일 정리
      await fs.remove(zipPath);

      return {
        extractedPath: extractDir,
        files: fileInfo,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export { TolgeeService };
export type { TolgeeServiceOptions };
