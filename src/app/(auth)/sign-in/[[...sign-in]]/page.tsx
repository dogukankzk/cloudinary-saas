"use client";

import { SignIn } from "@clerk/nextjs";
import { dark } from '@clerk/themes'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 p-4">
      <SignIn
        path="/sign-in"
        routing="path"
        appearance={{
          baseTheme: dark,
        }}
      />
    </div>
  );
}
