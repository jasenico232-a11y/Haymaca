import { NextResponse } from "next/server";
import { cancelDepartureForWeather } from "@/lib/booking/service";
import { getBookingStore } from "@/lib/booking/store";

/** Test-only seam, gated behind ENABLE_TEST_HOOKS: triggers a weather
 *  cancellation (the operator page does this via a server action). */
export async function POST(request: Request) {
  if (process.env.ENABLE_TEST_HOOKS !== "1")
    return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = (await request.json()) as { departureId?: unknown };
  if (typeof body.departureId !== "string")
    return NextResponse.json({ error: "invalid_request" }, { status: 422 });

  const result = await cancelDepartureForWeather(body.departureId);
  const departure = getBookingStore().getDeparture(body.departureId);
  return NextResponse.json({
    ok: result.ok,
    affected: result.affected,
    departureStatus: departure?.status ?? null,
  });
}
