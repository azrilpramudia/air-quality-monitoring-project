import { PrismaClient } from "@prisma/client";
import fs from "fs";
import csv from "csv-parser";

const prisma = new PrismaClient();
const FILE_PATH = "sensor_data.csv";

function parseTimestamp(ts) {
  if (!ts || ts.trim().length === 0) return null;

  let clean = ts.replace(" ", "T");

  const d = new Date(clean);
  if (isNaN(d.getTime())) {
    console.warn("⚠ Invalid timestamp:", ts);
    return null;
  }

  return d;
}

async function importCSV() {
  try {
    const rows = [];

    fs.createReadStream(FILE_PATH)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", async () => {
        console.log(`📊 Loaded ${rows.length} rows from CSV`);

        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];

          const parsedDate = parseTimestamp(r.ts);
          if (!parsedDate) {
            console.warn(`⚠ Skipping row ${i} — Invalid date:`, r.ts);
            continue;
          }

          try {
            await prisma.sensorData.create({
              data: {
                temperature: Number(r.temp_c),
                humidity: Number(r.rh_pct),
                tvoc: Number(r.tvoc_ppb),
                eco2: Number(r.eco2_ppm),
                dust: Number(r.dust_ugm3),
                aqi: null,
                createdAt: parsedDate,
              },
            });
          } catch (err) {
            console.error(`❌ Insert failed at row ${i}:`, err);
          }
        }

        console.log("✅ Import finished!");
        await prisma.$disconnect();
      });
  } catch (err) {
    console.error("❌ Import error:", err);
    await prisma.$disconnect();
  }
}

importCSV();
