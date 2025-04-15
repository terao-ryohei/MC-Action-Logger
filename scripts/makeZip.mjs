import { zip } from "zip-a-folder";
import { join } from "node:path";

// Windowsのファイルパスを指定（WSL環境から/mnt/c/でアクセス）
const WIN_OUTPUT_DIR = "/mnt/c/Users/Ryohei/work/MineCraftScript";
const WIN_OUTPUT_DIR2 =
  "/mnt/c/Users/Ryohei/AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_behavior_packs";

async function makeZip() {
  try {
    const sourcePath = "./scripts";
    const outputPath = join(WIN_OUTPUT_DIR, "ActionLogger.zip");

    await zip(sourcePath, outputPath);

    const outputPath2 = join(WIN_OUTPUT_DIR2, "ActionLogger.zip");

    await zip(sourcePath, outputPath2);
    console.log("Successfully created zip");
  } catch (error) {
    console.error("Error creating zip file:", error);
    process.exit(1);
  }
}

makeZip();
