import { copyFile } from "node:fs/promises";
import { join } from "node:path";

async function copyFiles() {
  // プロジェクトルートからの相対パスでファイルをコピー
  await copyFile("pack_icon.png", join("build", "pack_icon.png"));
  await copyFile("manifest.json", join("build", "manifest.json"));
  console.log("Files copied successfully!");
}

copyFiles().catch(console.error);
