// The Supabase Edge Functions (supabase/functions/*/index.ts) run on Deno. They are only imported here by tests, which
// stub these globals, so this is just enough for the type checker.
declare const Deno: {
  env: { get(name: string): string | undefined }
  serve(handler: (req: Request) => Response | Promise<Response>): unknown
}
