// /app/api/addPopulationDensity/route.js

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import { fromFile, GeoTIFFImage, TypedArray } from 'geotiff';
import { ElevationData } from './mergeElevationCsv';

/**
 * Load a local GeoTIFF file and return the first image.
 * Here we use fs.readFileSync to read the file into a Node Buffer,
 * then convert it to an ArrayBuffer and call GeoTIFF.fromArrayBuffer.
 */
async function loadGeoTiff(filePath: string) {
  // const fileBuffer = fs.readFileSync(filePath);
  // // Convert Node.js Buffer to ArrayBuffer
  // const arrayBuffer = fileBuffer.buffer.slice(
  //   fileBuffer.byteOffset,
  //   fileBuffer.byteOffset + fileBuffer.byteLength
  // );
  const tiff = await fromFile(filePath);
  const image = await tiff.getImage();
  return image;
}

// async function loadGeoTiff(filePath: string): Promise<GeoTIFFImage> {
//     // Read the file into a Node Buffer
//     const fileBuffer = fs.readFileSync(filePath);
//     // Create a Blob from the Buffer. (Requires Node 18+ or a Blob polyfill.)
//     const blob = new Blob([fileBuffer]);
//     // Use fromBlob to load the GeoTIFF.
//     const tiff = await GeoTIFF.fromBlob(blob);
//     const image = await tiff.getImage();
//     return image;
//   }

/**
 * Given a GeoTIFF image (in EPSG:4326) and a geographic coordinate (lat, lon),
 * compute the corresponding pixel coordinates and extract the population density value.
 * Assumes that:
 * - The GeoTIFF has a tie point (first one) that gives the top‑left corner (x: lon, y: lat).
 * - The file directory has a ModelPixelScale array: [pixelWidth, pixelHeight, ...].
 */
async function getPopulationDensityAtPoint(image: GeoTIFFImage, lat: number, lon: number) {
  const tiePoints = image.getTiePoints();
  if (!tiePoints || tiePoints.length === 0) {
    throw new Error("No tie points found in the GeoTIFF.");
  }
  const tiePoint = tiePoints[0]; // typically top-left
  const pixelScale = image.getFileDirectory().ModelPixelScale;
  if (!pixelScale) {
    throw new Error("No ModelPixelScale found in the GeoTIFF.");
  }
  // In a GeoTIFF in EPSG:4326, tiePoint.x is the longitude of the upper-left corner,
  // and tiePoint.y is the latitude of the upper-left corner.
  // Pixel size: pixelScale[0] is degrees per pixel in longitude,
  // and pixelScale[1] is degrees per pixel in latitude.
  const col = (lon - tiePoint.x) / pixelScale[0];
  const row = (tiePoint.y - lat) / pixelScale[1];
  
  // Round to nearest integer pixel coordinate
  const pixelX = Math.floor(col);
  const pixelY = Math.floor(row);

  // Define a window of one pixel
  const window = [pixelX, pixelY, pixelX + 1, pixelY + 1];
  const rasterData = await image.readRasters({ window });
  const typedRasterData = rasterData as TypedArray[];
  // Assume the first band holds the population density value.
  return typedRasterData[0][0];
}

/**
 * Reads a CSV file and returns an array of row objects.
 */
function readCSV(filePath: string, delimiter = ';') {
  return new Promise<ElevationData[]>((resolve, reject) => {
    const rows: ElevationData[] = [];
    fs.createReadStream(filePath)
      .pipe(csv({ separator: delimiter }))
      .on('data', row => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

/**
 * Writes an array of row objects to a CSV file.
 */
function writeCSV(filePath: string, rows: PopulationData[], delimiter = ';') {
  const headers = Object.keys(rows[0]).map(key => ({ id: key, title: key }));
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: headers,
    fieldDelimiter: delimiter,
  });
  return csvWriter.writeRecords(rows);
}

export type PopulationData = ElevationData & { population_density?: string}


/**
 * Main function to process the CSV, add population density for each school,
 * and write an output CSV.
 */
export async function addPopulationDencityToCSV() {
  // Define file paths
  const inputCSVPath = path.join(process.cwd(), 'public', 'schools-with-towers-and-elevation.csv');
  const outputCSVPath = path.join(process.cwd(), 'public', 'schools-with-towers-elevation-and-population.csv');
  const geoTiffPath = path.join(process.cwd(), 'public', 'pop_density.tif');

  // Load the local GeoTIFF (population density data)
  const image = await loadGeoTiff(geoTiffPath);
  console.log(`Loaded GeoTIFF from ${JSON.stringify(image)}`);
  
  // Read merged CSV
  const rows: PopulationData[] = await readCSV(inputCSVPath, ';');
  console.log(`Loaded ${rows.length} rows from merged.csv`);
  
  // For each row, extract the population density at the school's location
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // Expecting the school’s coordinates to be in 'latitude' and 'longitude' fields.
    const lat = parseFloat(row.latitude);
    const lon = parseFloat(row.longitude);

    if (isNaN(lat) || isNaN(lon)) {
      row.population_density = '';
    } else {
      try {
        const density = await getPopulationDensityAtPoint(image, lat, lon);
        row.population_density = density.toString();
      } catch (err) {
        console.error(`Error extracting density for row ${i}:`, err);
        row.population_density = '';
      }
    }
  }
  
  // Write the updated rows to the output CSV
  await writeCSV(outputCSVPath, rows, ';');
  console.log(`Successfully wrote ${rows.length} rows to ${outputCSVPath}`);
  return outputCSVPath;
}

