'use client'

import Link from "next/link";

export default function Home() {

  const callMerge = async () => {
    const response = await fetch('/api/mergeSchoolsAndTowers', {
      method: 'POST'
    });
    const data = await response.json();
    console.log(data);
  }

  const callElevation = async () => {
    const response = await fetch('/api/addElevation', {
      method: 'GET'
    });
    const data = await response.json();
    console.log(data);
  }

  const callPopulation = async () => {
    const response = await fetch('/api/addPopulationDencity', {
      method: 'GET'
    });
    const data = await response.json();
    console.log(data);
  }

  const callRecommendation = async () => {
    const response = await fetch('/api/addRecommendation', {
      method: 'GET'
    });
    const data = await response.json();
    console.log(data);
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="flex justify-center w-full">
          <Link href="/" passHref>
            <div
              className="rounded-full bg-blue-500 text-white text-2xl sm:text-3xl h-45 w-45 flex items-center justify-center self-center hover:bg-blue-700 transition-colors text-center"
              rel="noopener noreferrer"
            >
              Go to Analytics
            </div>
          </Link>
        </div>
        
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <button
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            onClick={callMerge}
            rel="noopener noreferrer"
          >
            Merge Schools with nearest Towers
          </button>
          <button
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            onClick={callElevation}
            rel="noopener noreferrer"
          >
            Merge Elevation
          </button>
          <button
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            onClick={callPopulation}
            rel="noopener noreferrer"
          >
            Merge Population Dencity
          </button>
          <button
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            onClick={callRecommendation}
            rel="noopener noreferrer"
          >
            Merge Recommendation
          </button>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
       
      </footer>
    </div>
  );
}
