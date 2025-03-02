import { readCSVRecommendation, RecommendationType } from '@/scripts/mergeRecommendationCsv';
import { NextResponse } from 'next/server';
import path from 'path';

// API Route handler (GET request)
export async function GET() {
    const inputCSVPath = path.join(process.cwd(), 'public', 'ready-data.csv');
    
    try {
      const rows: RecommendationType[] = await readCSVRecommendation(inputCSVPath, ';');
      console.log(rows);
      return NextResponse.json({
        success: true,
        data: rows,
      });
    } catch (error) {
      console.error('Error in API handler:', error);
      return NextResponse.error();
    }
  }