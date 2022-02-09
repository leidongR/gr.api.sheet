export const getProcessEnv = (
  envName: string,
  defaultVal: string = undefined
) => {
  let e = process.env[envName] || defaultVal;
  if (e == null || e === "") {
    throw new Error(`server error: process.env.${envName} is undefined`);
  }
  return e;
};
