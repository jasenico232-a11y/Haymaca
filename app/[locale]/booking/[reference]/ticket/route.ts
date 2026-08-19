import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import { getBooking } from "@/lib/booking/service";
import { getBookingStore } from "@/lib/booking/store";
import { signTicket } from "@/lib/tickets/token";
import { formatUsd } from "@/lib/booking/money";
import { formatDepartureDate } from "@/lib/booking/format";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Params = { locale: string; reference: string };

export async function GET(
  request: Request,
  { params }: { params: Promise<Params> },
) {
  if (!rateLimit(clientKey(request, "ticket"), 30, 60_000).ok)
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const { locale, reference } = await params;
  const booking = getBooking(reference);
  if (!booking || booking.status !== "confirmed")
    return NextResponse.json({ error: "not_found" }, { status: 404 });

  const dict = getDictionary(isLocale(locale) ? locale : "en");
  const items = dict.tours.items as Record<string, { title: string }>;
  const departure = getBookingStore().getDeparture(booking.departureId);
  const title = items[booking.tourSlug]?.title ?? booking.tourSlug;
  const s = dict.book.status;

  // The QR carries the SIGNED ticket token, not the raw booking id.
  const token = signTicket(booking.id, booking.departureId);
  const qrPng = await QRCode.toBuffer(token, { margin: 1, width: 320 });

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([420, 595]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.07, 0.078, 0.059);
  const muted = rgb(0.4, 0.4, 0.37);

  page.drawText("Haymaca", { x: 40, y: 548, size: 22, font: bold, color: ink });
  page.drawText(s.eticketTitle, { x: 40, y: 526, size: 12, font, color: muted });
  page.drawText(title, { x: 40, y: 496, size: 15, font: bold, color: ink });

  const rows: Array<[string, string]> = [
    [
      s.departs,
      departure
        ? formatDepartureDate(departure.date, isLocale(locale) ? locale : "en")
        : "",
    ],
    [s.party, String(booking.partySize)],
    [s.reference, booking.reference],
    [s.depositPaid, formatUsd(booking.depositCents)],
  ];
  let y = 458;
  for (const [label, value] of rows) {
    page.drawText(label, { x: 40, y, size: 9, font, color: muted });
    page.drawText(value, { x: 40, y: y - 15, size: 12, font: bold, color: ink });
    y -= 40;
  }

  const png = await pdf.embedPng(qrPng);
  const dim = 200;
  page.drawImage(png, { x: (420 - dim) / 2, y: 60, width: dim, height: dim });
  page.drawText(s.eticketBody, { x: 40, y: 40, size: 8, font, color: muted });

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="haymaca-ticket-${booking.reference}.pdf"`,
      "cache-control": "no-store",
    },
  });
}
