import { green, blue, gray, format, bold, red, yellow, walk, cyan } from "./deps.ts"

export const logger = async (
  { response, request }: { response: any; request: any },
  next: Function,
) => {
  await next();
  const status: number = response.status;
  console.log(`${gray(`[${format(new Date(Date.now()), "dd-MM-yyyy@hh:mm:ss")}]`)} [${request.method}] ${request.url.pathname} ${status < 299 ? bold(green(String(status))) : status < 399 ? bold(blue(String(status))) : bold(red(String(status)))} `);
};

const arraysEqual = (a: any[], b: any[]) => {
  a = Array.isArray(a) ? a : [];
  b = Array.isArray(b) ? b : [];
  return a.length === b.length && a.every((el, ix) => el === b[ix]);
}

export const endpoints = new Map()

for await (const walkEntry of walk("./src/endpoints")) {
  if (walkEntry.isFile && walkEntry.name.split(".").at(-1) == "ts") {
    const path = walkEntry.path.split("/").slice(2).map((section: string) => {
      return section.split(".")[0]
    })

    const { GET, HEAD, POST, PUT, DELETE, OPTIONS, PATCH, TRACE } = await import(`./${walkEntry.path}`)
    const m = [
      ["GET", GET],
      ["HEAD", HEAD],
      ["POST", POST],
      ["PUT", PUT],
      ["DELETE", DELETE],
      ["OPTIONS", OPTIONS],
      ["PATCH", PATCH],
      ["TRACE", TRACE] 
    ]
    const o = m.map((method) => {
      if (method[1]) {
        return method
      }
    }).filter((k) => k !== undefined)

    if (o.length > 0) {
      endpoints.set('/' + path.join('/'), o)
      console.log(`${green("[SUCCESS]")} Loaded endpoint ${blue("/" + path.join("/"))} with methods ${o.map((t) => cyan(t[0]))}`)
    } else {
      console.log(`${red("[WARN]")} Failed to load endpoint ${yellow("/" + path.join("/"))} as there are no supported methods exported`)
    }
  }
}

export const endpointHandler = async (ctx: any, next: Function) => {
  
  const req = ctx.request.url.pathname.split("/").filter((a: string) => { return a != '' })

  for (const [key, value] of endpoints.entries()) {
    const endpoint = key.split('/').filter((a: string) => { return a != '' })
    const path: string[] = []

    req.forEach((p: string, i: number) => {
      if (endpoint[i] == p) { 
        path.push(p)
      } else if (endpoint[i].indexOf("[") > -1) {
        path.push(endpoint[i])
      }
    })

    if (arraysEqual(path, endpoint)) {
      const methods = endpoints.get('/' + path.join('/'))
      const func = methods.map((m: any[]) => {
        if (m.includes(ctx.request.method)) {
          return m[1]
        }
      }).filter((k) => k !== undefined)

      if (func[0]) {
        console.log(func)
        await func[0](ctx)
      } else {
        ctx.response.status = 405
      }

      next()
    }
  }
}

