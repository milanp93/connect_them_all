// /app/api/getRecommendations/route.js

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import fetch from 'node-fetch';
import { PopulationData } from './mergePopulationDenciryCsv';

const AIMLAPI_URL = 'https://api.aimlapi.com/chat/completions';
const AIMLAPI_KEY = process.env.AIMLAPI_KEY;

// Helper: Read CSV file into an array of rows.
export function readCSV(filePath: string, delimiter = ';') {
  return new Promise<PopulationData[]>((resolve, reject) => {
    const rows: PopulationData[] = [];
    fs.createReadStream(filePath)
      .pipe(csv({ separator: delimiter }))
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

export function readCSVRecommendation(filePath: string, delimiter = ';') {
  return new Promise<RecommendationDetailedType[]>((resolve, reject) => {
    const rows: RecommendationDetailedType[] = [];
    fs.createReadStream(filePath)
      .pipe(csv({ separator: delimiter }))
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

export type RecommendationType = {
  schoolId: string,
  scoreOfImpact: string,
  recommendedSolutionWhy: string,
  recommendedSolutionEstimatedCost: string,
  alternativeSolutionWhyAndWhyIsWorse: string,
  alternativeSolutionEstimatedCost: string,
}

export type RecommendationDetailedType = RecommendationType &{
  lat: string,
  lon: string,
  schoolName: string,
}

// Helper: Write an array of row objects to a CSV file.
function writeCSV(filePath: string, rows: RecommendationDetailedType[], delimiter = ';') {
  const headers = Object.keys(rows[0]).map((key) => ({ id: key, title: key }));
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: headers,
    fieldDelimiter: delimiter,
  });
  return csvWriter.writeRecords(rows);
}

/**
 * Calls the aimlapi.com endpoint with data (distance, elevation, populationDensity)
 * to get recommendations for the best connectivity solution.
 * @param {object} payloadData - Object with keys: distance, elevation, populationDensity.
 * @returns {Promise<object>} - API response containing recommended_solution, price, etc.
 */
async function getRecommendationForSchool(prompt: string) {
  const response = await fetch(AIMLAPI_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AIMLAPI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 8192,
      stream: false,
    }),
  });
  if (!response.ok) {
    throw new Error(`aimlapi call failed: ${response.statusText}`);
  }
  return await response.json();
}

function cleanResponse(rawResponse: string) {
  // Remove leading and trailing triple backticks and any "json" label.
  return rawResponse.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
}

/**
 * Main function to process the CSV, call aimlapi.com for recommendations,
 * and write an updated CSV with recommendation fields.
 */
export async function addRecommendationToCSV() {
  const inputCSVPath = path.join(process.cwd(), 'public', 'schools-with-towers-elevation-and-population.csv');
  const outputCSVPath = path.join(process.cwd(), 'public', 'ready-data.csv');

  // Read merged CSV
  const rows: PopulationData[] = await readCSV(inputCSVPath, ';');
  console.log(`Loaded ${rows.length} rows from merged.csv`);

  const inputData = [];

  // Process each row: for each school record, send the data to aimlapi.com to get a recommendation.
  for (let i = 0; i < 1000; i++) {
    const row = rows[i];

    if(!row?.distance_km || !row?.range || !row?.radio || !row?.population_density || (row?.population_density && Number(row.population_density) <= 0))
      continue

    // Parse necessary fields from the row.
    // Assume:
    // - 'distance' is the computed distance from school to tower in kilometers.
    // - 'range' is the range of tower station.
    // - 'elevation_profile' is a JSON string with an array of elevation values.
    // - 'population_density' is already added from previous processing.
    const schoolId = row.school_id_giga
    const distance = parseFloat(row.distance_km);
    const towerRange = row.range;
    const networkType = row.radio;
    const populationDensity = row?.population_density? parseFloat(row?.population_density) : 0;
    const elevationProfile = row.elevation_profile;
    inputData.push({schoolId, distance, towerRange, networkType, populationDensity, elevationProfile})

  }


    // Prepare payload with fallback values.
    const prompt =`You are an expert in public sector connectivity planning. Based on the following data, please analyze and recommend 5 schools with the best connectivity solution.

Input data is array of those fields:
- School Id: {schoolId}.
- Network type: {networkType}.
- Distance from school to tower: {distance} kilometers.
- Tower range: {towerRange} kilometers.
- Elevation profile (10 sample points along the straight line from school to tower): {elevationProfile} 
  (an array of 10 elevation values in meters).
- School population density: {populationDensity} (people per square kilometer).

Please perform the following tasks:
1. Calculate a "scoreOfImpact" from 0 to 100 that for each item of provided data that reflects the effectiveness of the solution how much it will cost and to be relative to the population density, where a lower cost per population density unit yields a higher score.
2. Find top 5 schools that has the best connectivity solution based on scoreOfImpact from provided data 
2. Recommend the optimal connectivity solution (e.g., fiber, wireless, satellite) for this scenario.
2. Explain in detail why the recommended solution is optimal and provide an estimated implementation cost.
3. Provide alternative connectivity solutions with explanations on why they are less favorable, along with their estimated costs.

Return the answer as raw JSON (do not wrap it in triple backticks or markdown formatting), and ensure the output is a complete JSON object
{
  "results": [
  {
    "schoolId": "schoolId that was provided by input data needs to stay the same so we can know which school is in recommendation",
    "scoreOfImpact": <number between 0 and 100>,
    "recommendedSolution": {
      "why": "<detailed explanation of the recommended solution>",
      "estimatedCost": "<estimated cost (include currency if applicable)>"
    },
    "alternativeSolution":
    {
      "whyAndWhyIsWorse": "<explanation of an alternative solution and why is less favorable>",
      "estimatedCost": "<estimated cost (include currency if applicable)>"
    }
  }
  // Include top 5 results with best scrofeOfImpact.
  ]
}

Analize this input array for the input data:
${JSON.stringify(inputData)}
`


  try {
    const recommendation = await getRecommendationForSchool(prompt);
    console.log(`Got recommendation:`, JSON.stringify(recommendation));
    const recommendationData = recommendation as { choices: { message: { content: string } }[] };
    const cleanedResponse = cleanResponse(recommendationData.choices[0].message.content)
    const recommendationObject: {
      results: [
        {
          schoolId: string,
          scoreOfImpact: string,
          recommendedSolution: {
            why: string,
            estimatedCost: string
          },
          alternativeSolution:
          {
            whyAndWhyIsWorse: string,
            estimatedCost: string
          }
        }]
    } = JSON.parse(cleanedResponse);
    console.log(`Got recommendation Object content:`, recommendationObject);
    const rowsTree: { [key: string]: PopulationData } = {}
    for(const row of rows){
      rowsTree[row.school_id_giga] = row
    }
    console.log(`Got rowsTree:`, rowsTree);
    const recommendationCSVArray: RecommendationDetailedType[] = recommendationObject.results.map((item) => {
    console.log(`Got rowsTree[item.schoolId].school_name:`, rowsTree[item.schoolId].school_name);
    console.log(`Got rowsTree[item.schoolId].latitude:`, rowsTree[item.schoolId].latitude);
    console.log(`Got rowsTree[item.schoolId].longitude:`, rowsTree[item.schoolId].longitude);
    return {
        schoolId: item.schoolId,
        scoreOfImpact: item.scoreOfImpact,
        recommendedSolutionWhy: item.recommendedSolution.why,
        recommendedSolutionEstimatedCost: item.recommendedSolution.estimatedCost,
        alternativeSolutionWhyAndWhyIsWorse: item.alternativeSolution.whyAndWhyIsWorse,
        alternativeSolutionEstimatedCost: item.alternativeSolution.estimatedCost,
        schoolName: rowsTree[item.schoolId].school_name,
        lat: rowsTree[item.schoolId].latitude,
        lon: rowsTree[item.schoolId].longitude,

      }
    })



    await writeCSV(outputCSVPath, recommendationCSVArray, ';');
    console.log(`Successfully wrote ${recommendationCSVArray.length} rows to ${outputCSVPath}`);
  } catch (err) {
    console.error(`Error getting recommendation:`, err);
  }
}
