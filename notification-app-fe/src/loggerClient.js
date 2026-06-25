import { Log } from "../../utils/logger.js";

export async function logFrontend(level, packageName, message) {
  try {
    return await Log("frontend", level, packageName, message);
  } catch (error) {
    console.warn(error.message);
    return null;
  }
}
