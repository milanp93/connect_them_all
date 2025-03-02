import { NextResponse } from 'next/server';
import { mergeSchoolsAndTowers } from '@/scripts/mergeSchoolWithNearestStationCsv';

export async function POST() {
  try {
    await mergeSchoolsAndTowers();
    return NextResponse.json({ success: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}