import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/signin",
  "/signup",
  "/",
  "/home",
]);

const isPublicApiRoute = createRouteMatcher([
  "/api/videos"
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = new URL(req.url);
  const path = url.pathname;

  const isNavigatingToDashboard = path === "/home";
  const isApiRequest = path.startsWith("/api");

  // Redirect logged-in user away from public auth pages
  if (userId && isPublicRoute(req) && !isNavigatingToDashboard) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  // If user is not authenticated
  if (!userId) {
    const isProtectedPage = !isPublicRoute(req) && !isApiRequest;
    const isProtectedApi = isApiRequest && !isPublicApiRoute(req);

    if (isProtectedPage || isProtectedApi) {
      return NextResponse.redirect(new URL("/signin", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
