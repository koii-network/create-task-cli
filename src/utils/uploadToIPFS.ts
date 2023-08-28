import fs from "fs"
import { CIDString, Filelike, Web3Storage, getFilesFromPath } from "web3.storage";
import * as dotenv from "dotenv";
dotenv.config();
export async function uploadIpfs(
  filePath: string,
  secret_web3_storage_key: string
): Promise<string> {
  const path = `${filePath}`;
  //console.log(filePath);
  //console.log(secret_web3_storage_key);
  console.log("FILEPATH", path)
  if (path.substring(path.length - 7) !== "main.js") {
    console.error("Provide a valid path to webpacked 'main.js' file");
    process.exit();
  }
  if (fs.existsSync(path)) {
    console.log("FIle is present");
    const storageClient = new Web3Storage({
      token: secret_web3_storage_key || ""
    });

    let cid:CIDString="";

    if (storageClient) {
      const upload = await getFilesFromPath(path);
      cid = await storageClient.put(upload as unknown as Iterable<Filelike>);
    }
    console.log("CID of executable", cid);
    return cid;
  } else {
    console.error("\x1b[31m%s\x1b[0m", "task_audit_program File not found");
    process.exit();
  }
}
