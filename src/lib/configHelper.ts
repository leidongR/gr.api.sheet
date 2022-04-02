import config = require("config");

export const getEnv = (
  key: string,
  type: "string" | "int" | "float" | "stringArray"
) => {
  const _Prefix = config.get("process_env_prefix") as string;
  const _Joiner = config.get("process_env_source_local_joiner") as string;
  const envKey = (_Prefix + key).replace(".", "_");

  if (!Object.prototype.hasOwnProperty.call(process.env, envKey)) {
    return undefined;
  }
  const str = process.env[envKey];

  switch (type) {
    case "string":
      return str;
    case "int":
      return parseInt(str);
    case "float":
      return parseFloat(str);
    case "stringArray":
      return str
        .split(_Joiner)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    default:
      throw new Error(`[Error] getEnv: unknown type: ${type}`);
  }
};

export const getStrConfig = (key: string) => {
  return (getEnv(key, "string") || config.get(key)) as string;
};

export const getIntConfig = (key: string) => {
  return (getEnv(key, "int") || config.get(key)) as number;
};
export const getFloatConfig = (key: string) => {
  return (getEnv(key, "float") || config.get(key)) as number;
};
export const getStrArrayConfig = (key: string) => {
  return (getEnv(key, "stringArray") || config.get(key)) as string[];
};
