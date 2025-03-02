/**
 * mergeSchoolWithNearestStationCsv.ts
 * Node.js script to:
 *  1. Read two CSV files (schools, towers)
 *  2. Find the nearest tower for each school
 *  3. Output a new CSV with combined data
 */

import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';

// Haversine formula to compute distance (in km) between two lat/lon points
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const toRad = (val: number) => (val * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

// We'll read the CSV data into arrays
interface School {
    country: string;
    iso2_code: string;
    iso3_code: string;
    school_id_giga: string;
    school_name: string;
    admin1_id_giga: string;
    admin2_id_giga: string;
    education_level: string;
    connectivity: string;
    latitude: string;
    longitude: string;
    school_data_source: string;
}

interface Tower {
    radio: string;
    mcc: string;
    net: string;
    area: string;
    cell: string;
    unit: string;
    lon: string;
    lat: string;
    range: string;
    samples: string;
    changeable: string;
    created: string;
    updated: string;
    averageSignal: string;
}

const schools: School[] = [];
const towers: Tower[] = [];

// Input file paths (adjust if needed)
const SCHOOLS_CSV = path.join(process.cwd(), 'public', 'schools.csv');
const TOWERS_CSV = path.join(process.cwd(), 'public', 'towers.csv');
const OUTPUT_CSV = path.join(process.cwd(), 'public', 'schools-with-towers.csv');

// Step 1: Load Towers
function loadTowers() {
  return new Promise((resolve, reject) => {
    fs.createReadStream(TOWERS_CSV)
      .pipe(csv({ separator: ';' }))
      .on('data', (row) => {
        // row will have fields like:
        // radio, mcc, net, area, cell, unit, lon, lat, range, samples, changeable, created, updated, averageSignal
        towers.push(row);
      })
      .on('end', () => {
        console.log(`Loaded ${towers.length} towers from ${TOWERS_CSV}`);
        resolve(towers);
      })
      .on('error', reject);
  });
}

// Step 2: Load Schools
function loadSchools() {
  return new Promise((resolve, reject) => {
    fs.createReadStream(SCHOOLS_CSV)
      .pipe(csv({ separator: ';' }))
      .on('data', (row) => {
        // row will have fields like:
        // country, iso2_code, iso3_code, school_id_giga, school_name, admin1_id_giga, ...
        // connectivity, latitude, longitude, school_data_source, etc.
        schools.push(row);
      })
      .on('end', () => {
        console.log(`Loaded ${schools.length} schools from ${SCHOOLS_CSV}`);
        resolve(schools);
      })
      .on('error', reject);
  });
}

// Step 3: Find nearest tower for each school
function findNearestTowers() {
  console.log('Finding nearest towers for each school...');
  // We'll create an array of combined data
  const combinedData = [];

  for (const school of schools) {
    // Convert lat/lon to numbers
    const schoolLat = parseFloat(school.latitude);
    const schoolLon = parseFloat(school.longitude);

    let nearestTower = null;
    let minDistance = Infinity;

    for (const tower of towers) {
      const towerLat = parseFloat(tower.lat);
      const towerLon = parseFloat(tower.lon);

      // If lat/lon is invalid, skip
      if (isNaN(towerLat) || isNaN(towerLon)) continue;

      const dist = haversineDistance(schoolLat, schoolLon, towerLat, towerLon);

      if (dist < minDistance) {
        minDistance = dist;
        nearestTower = tower;
      }
    }

    // Prepare a single row with all school fields + the nearest tower fields
    if (nearestTower) {
        console.log(nearestTower);
      combinedData.push({
        // School fields
        country: school.country,
        iso2_code: school.iso2_code,
        iso3_code: school.iso3_code,
        school_id_giga: school.school_id_giga,
        school_name: school.school_name,
        admin1_id_giga: school.admin1_id_giga,
        admin2_id_giga: school.admin2_id_giga,
        education_level: school.education_level,
        connectivity: school.connectivity,
        latitude: school.latitude,
        longitude: school.longitude,
        school_data_source: school.school_data_source,

        // Tower fields
        radio: nearestTower.radio,
        mcc: nearestTower.mcc,
        net: nearestTower.net,
        area: nearestTower.area,
        cell: nearestTower.cell,
        unit: nearestTower.unit,
        tower_lon: nearestTower.lon,
        tower_lat: nearestTower.lat,
        range: nearestTower.range,
        samples: nearestTower.samples,
        changeable: nearestTower.changeable,
        created: nearestTower.created,
        updated: nearestTower.updated,
        averageSignal: nearestTower.averageSignal,

        // Distance in km
        distance_km: minDistance.toFixed(3),
      });
    } else {
      // No valid tower found (should be rare), but handle gracefully
      combinedData.push({
        ...school,
        error: 'No valid tower found',
      });
    }
  }

  return combinedData;
}

// Step 4: Write output CSV
export interface CombinedData {
    country: string;
    iso2_code: string;
    iso3_code: string;
    school_id_giga: string;
    school_name: string;
    admin1_id_giga: string;
    admin2_id_giga: string;
    education_level: string;
    connectivity: string;
    latitude: string;
    longitude: string;
    school_data_source: string;
    radio?: string;
    mcc?: string;
    net?: string;
    area?: string;
    cell?: string;
    unit?: string;
    tower_lon?: string;
    tower_lat?: string;
    range?: string;
    samples?: string;
    changeable?: string;
    created?: string;
    updated?: string;
    averageSignal?: string;
    distance_km?: string;
    error?: string;
}

async function writeOutputCSV(data: CombinedData[]) {
    // Define columns in the order you want them
    const csvWriter = createObjectCsvWriter({
        path: OUTPUT_CSV,
        header: [
            // School fields
            { id: 'country', title: 'country' },
            { id: 'iso2_code', title: 'iso2_code' },
            { id: 'iso3_code', title: 'iso3_code' },
            { id: 'school_id_giga', title: 'school_id_giga' },
            { id: 'school_name', title: 'school_name' },
            { id: 'admin1_id_giga', title: 'admin1_id_giga' },
            { id: 'admin2_id_giga', title: 'admin2_id_giga' },
            { id: 'education_level', title: 'education_level' },
            { id: 'connectivity', title: 'connectivity' },
            { id: 'latitude', title: 'latitude' },
            { id: 'longitude', title: 'longitude' },
            { id: 'school_data_source', title: 'school_data_source' },

            // Tower fields
            { id: 'radio', title: 'radio' },
            { id: 'mcc', title: 'mcc' },
            { id: 'net', title: 'net' },
            { id: 'area', title: 'area' },
            { id: 'cell', title: 'cell' },
            { id: 'unit', title: 'unit' },
            { id: 'tower_lon', title: 'tower_lon' },
            { id: 'tower_lat', title: 'tower_lat' },
            { id: 'range', title: 'range' },
            { id: 'samples', title: 'samples' },
            { id: 'changeable', title: 'changeable' },
            { id: 'created', title: 'created' },
            { id: 'updated', title: 'updated' },
            { id: 'averageSignal', title: 'averageSignal' },

            // Distance
            { id: 'distance_km', title: 'distance_km' },
        ],
    });

    await csvWriter.writeRecords(data);
    console.log(`Successfully wrote ${data.length} rows to ${OUTPUT_CSV}`);
}

// Main flow
export const mergeSchoolsAndTowers = async () => {
  try {
    await loadTowers();
    await loadSchools();

    const combined = findNearestTowers();
    await writeOutputCSV(combined);

    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
  }
}
