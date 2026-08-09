import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Generated metadata routes (`icon`, `apple-icon`) have no file extension, so
  // the dot rule below does not cover them. Without an explicit exclusion they
  // get redirected to `/en/icon`, where nothing is served.
  matcher: "/((?!api|trpc|_next|_vercel|icon|apple-icon|.*\\..*).*)",
};
