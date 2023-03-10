import { format, colors } from "./deps.ts"

export const logger = async (
  { response, request }: { response: any; request: any },
  next: Function,
) => {
  await next();
  const status: number = response.status;
  console.log(`${colors.gray(`[${format(new Date(Date.now()), "dd-MM-yyyy@hh:mm:ss")}]`)} [${request.method}] ${request.url.pathname} ${status < 299 ? colors.bold(colors.green(String(status))) : status < 399 ? colors.bold(colors.blue(String(status))) : colors.bold(colors.red(String(status)))} `);
};


