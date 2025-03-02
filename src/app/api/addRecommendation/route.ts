import { addRecommendationToCSV } from '@/scripts/mergeRecommendationCsv';
import { NextResponse } from 'next/server';

// API Route handler (GET request)
export async function GET() {
    try {
      await addRecommendationToCSV();
      return NextResponse.json({
        success: true,
        message: 'Processing complete',
      });
    } catch (error) {
      console.error('Error in API handler:', error);
      return NextResponse.error();
    }
  }