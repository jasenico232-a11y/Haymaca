import { NextResponse } from "next/server";
import { issueSession } from "@/lib/operator/auth";

/** Test-only seam, gated behind ENABLE_TEST_HOOKS: returns a valid operator
 *  session cookie value so the suite can exercise the auth-gated scan route. */
export async function GET() {
  if (process.env.ENABLE_TEST_HOOKS !== "1")
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ cookie: issueSession() });
}
