import { copyFile } from "node:fs/promises";
import { join } from "node:path";

async function copyFiles() {
  // プロジェクトルートからの相対パスでファイルをコピー
  await copyFile("pack_icon.png", join("dist", "pack_icon.png"));
  await copyFile("manifest.json", join("dist", "manifest.json"));
  console.log("Files copied successfully!");
}

copyFiles().catch(console.error);
