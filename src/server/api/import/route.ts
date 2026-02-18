import { parseSimplePositionsCsv } from "../../csv-import";

export async function POST(request: Request) {
  const payload = await request.json();
  const csvRaw = String(payload.csv ?? "");

  const records = parseSimplePositionsCsv(csvRaw);

  return Response.json({
    status: "stub",
    accepted: records.length,
    records,
  });
}
