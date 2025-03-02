// /app/api/addElevationProfile/route.js

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import fetch from 'node-fetch';
import { CombinedData } from './mergeSchoolWithNearestStationCsv';

const GOOGLE_ELEVATION_URL = 'https://maps.googleapis.com/maps/api/elevation/json';
const GOOGLE_API_KEY = process.env.GOOGLE_ELEVATION_API_KEY; // Ensure this env variable is set
const NUM_SAMPLES = 3; // Number of sample points along the line

/**
 * Interpolates sample points along a straight line between two coordinates.
 * @param {number} lat1 - Starting latitude.
 * @param {number} lon1 - Starting longitude.
 * @param {number} lat2 - Ending latitude.
 * @param {number} lon2 - Ending longitude.
 * @param {number} numSamples - Number of points to generate.
 * @returns {string[]} - Array of strings "lat,lon" for each sample.
 */
function interpolatePoints(lat1: number, lon1: number, lat2: number, lon2: number, numSamples = NUM_SAMPLES) {
  const points = [];
  for (let i = 0; i < numSamples; i++) {
    const fraction = i / (numSamples - 1);
    const sampleLat = lat1 + (lat2 - lat1) * fraction;
    const sampleLon = lon1 + (lon2 - lon1) * fraction;
    points.push(`${sampleLat},${sampleLon}`);
  }
  return points;
}

interface ElevationDataResponse {status: string, results: [{elevation: number, location: {lat: number, lng: number},resolution: number}]}

/**
 * Calls the Google Elevation API for a batch of locations.
 * @param {string[]} points - Array of "lat,lon" strings.
 * @returns {Promise<number[]>} - Array of elevation values (in meters).
 */
async function fetchElevationForPoints(points:string[]) {
  // Build a single URL with all points separated by the pipe symbol.
  const locationsParam = points.join('|');
  const url = `${GOOGLE_ELEVATION_URL}?locations=${encodeURIComponent(locationsParam)}&key=${GOOGLE_API_KEY}`;
  console.log(`Calling Google Elevation API: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Elevation API request failed: ${response.statusText}`);
  }
  const data: ElevationDataResponse = await response.json() as ElevationDataResponse;
  if (data.status !== 'OK') {
    throw new Error(`Google Elevation API error: ${data.status}`);
  }
  // data.results is an array with objects having an "elevation" property.
  return data.results.map(result => result.elevation);
}

/**
 * Reads a CSV file and returns an array of row objects.
 * @param {string} filePath - Path to the CSV file.
 * @param {string} delimiter - CSV delimiter (default: comma).
 * @returns {Promise<object[]>}
 */
function readCSV(filePath: string, delimiter = ',') {
  return new Promise<CombinedData[]>((resolve, reject) => {
    const rows: CombinedData[] = [];
    fs.createReadStream(filePath)
      .pipe(csv({ separator: delimiter }))
      .on('data', row => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

/**
 * Writes an array of row objects to a CSV file.
 * @param {string} filePath - Path to write the CSV file.
 * @param {object[]} rows - Array of row objects.
 * @param {string} delimiter - CSV delimiter (default: comma).
 * @returns {Promise<void>}
 */
function writeCSV(filePath: string, rows: ElevationData[], delimiter = ';') {
  const headers = Object.keys(rows[0]).map(key => ({ id: key, title: key }));
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: headers,
    fieldDelimiter: delimiter,
  });
  return csvWriter.writeRecords(rows);
}

export type ElevationData = CombinedData & { elevation_profile?: string}

/**
 * Main processing: Reads merged CSV, calls the Google Elevation API
 * to get an elevation profile for each row, then writes output CSV.
 */
export async function addElevationToCSV() {
  const inputCSVPath = path.join(process.cwd(), 'public', 'schools-with-towers.csv');
  const outputCSVPath = path.join(process.cwd(), 'public', 'schools-with-towers-and-elevation.csv');
  
  const rows: ElevationData[] = await readCSV(inputCSVPath, ',');
  console.log(`Loaded ${rows.length} rows from merged.csv`);

  // Process each row to add an elevation_profile field.
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if(!row.tower_lat || !row.tower_lon || !row.latitude || !row.longitude) 
        continue;
    const schoolLat = parseFloat(row.latitude);
    const schoolLon = parseFloat(row.longitude);
    const towerLat = parseFloat(row.tower_lat);
    const towerLon = parseFloat(row.tower_lon);

    // Validate coordinates
    if (isNaN(schoolLat) || isNaN(schoolLon) || isNaN(towerLat) || isNaN(towerLon)) {
      row.elevation_profile = '';
      continue;
    }
    
    // Generate sample points along the straight line
    const samplePoints = interpolatePoints(schoolLat, schoolLon, towerLat, towerLon, NUM_SAMPLES);
    console.log(`Processing row ${i}: ${samplePoints.length} sample points`, samplePoints);
    try {
      const elevations = await fetchElevationForPoints(samplePoints);
      row.elevation_profile = JSON.stringify(elevations);
    } catch (err) {
      console.error(`Error processing row ${i}:`, err);
      row.elevation_profile = '';
    }
  }

  await writeCSV(outputCSVPath, rows, ';');
  console.log(`Successfully wrote ${rows.length} rows to output_with_profile.csv`);
  return outputCSVPath;
}
