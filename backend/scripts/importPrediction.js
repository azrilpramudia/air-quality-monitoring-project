import { PrismaClient } from "@prisma/client";
import fs from "fs";
import csv from "csv-parser";

const prisma = new PrismaClient();
const filePath = "./pred_7days_hourly_recursive_wib.csv";

async function importCSV() {
  console.log("🚀 Connecting to database...");
  await prisma.$connect();
  console.log("✅ DB connected!");

  let total = 0;
  const rows = [];

  console.log("📥 Reading CSV...");

  // STEP 1 — Read whole CSV first (avoid async stream crash)
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  console.log(`📦 Total rows loaded: ${rows.length}`);

  // STEP 2 — Insert rows in sequence (await one by one)
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const timestamp = new Date(row.timestamp);
    const tempPred = parseFloat(row.temp_c_pred);
    const tvocPred = parseFloat(row.tvoc_ppb_pred);

    if (timestamp == "Invalid Date" || isNaN(tempPred) || isNaN(tvocPred)) {
      console.log(`⚠ Skipping invalid row ${i + 1}`);
      continue;
    }

    try {
      await prisma.predictionData.create({
        data: {
          timestamp,
          tempPred,
          tvocPred,
        },
      });

      total++;
      console.log(`✔ Inserted row ${i + 1}`);
    } catch (err) {
      console.error("❌ Insert error at row", i + 1, err);
    }
  }

  console.log(`\n🎉 Import finished! Total inserted: ${total}`);

  await prisma.$disconnect();
}

importCSV();
