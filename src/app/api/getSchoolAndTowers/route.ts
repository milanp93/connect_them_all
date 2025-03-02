import { PopulationData } from '@/scripts/mergePopulationDenciryCsv';
import { readCSV } from '@/scripts/mergeRecommendationCsv';
import { NextResponse } from 'next/server';
import path from 'path';

// API Route handler (GET request)
export async function GET() {
    const inputCSVPath = path.join(process.cwd(), 'public', 'schools-with-towers-elevation-and-population.csv');
    
    try {
      const rows: PopulationData[] = await readCSV(inputCSVPath, ';');
      return NextResponse.json({
        success: true,
        data: rows,
      });
    } catch (error) {
      console.error('Error in API handler:', error);
      return NextResponse.error();
    }
  }