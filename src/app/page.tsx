'use client'
import ConnectivityMap from '@/components/ConnectivityMap';
import { PopulationData } from '@/scripts/mergePopulationDenciryCsv';
import { RecommendationType } from '@/scripts/mergeRecommendationCsv';
import { useEffect, useState } from 'react';


const Page = () => {
  const [schoolsAndTowers, setSchoolsAndTowers] = useState<PopulationData[]>([]);
  const [recommended, setRecommended] = useState<RecommendationType[]>([]);
  
  useEffect(() => {
    const getSchoolsAndTowers = async () => {
      const response = await fetch('/api/getSchoolsAndTowers', {
        method: 'GET'
      });
      const data = await response.json();
      setSchoolsAndTowers(data);
      console.log(data);
    }
    getSchoolsAndTowers()
    const getRecommendation = async () => {
      const response = await fetch('/api/getTopSchools', {
        method: 'GET'
      });
      const data = await response.json();
      setRecommended(data);
      console.log(data);
    }
    getRecommendation()
  }, []);
  console.log("REC:",recommended);
  return (
    <div>
      <h1>Server Side Rendered Page</h1>
      {!!schoolsAndTowers && !!recommended && <ConnectivityMap schoolsAndTowers={schoolsAndTowers} recommended={recommended} />}
    </div>
  );
};

// export const getServerSideProps: GetServerSideProps = async () => {
//   // Fetch data from an API or perform other server-side logic
//   const inputCSVPath = path.join(process.cwd(), 'public', 'schools-with-towers-elevation-and-population.csv');
//     const fetchData = async () => {
//       try {
//         const rows: PopulationData[] = await readCSV(inputCSVPath, ';');
//         return rows;
//       } catch (error) {
//         console.error('Error reading CSV:', error);
//         return [];
//       }
//     };

//     const rows = await fetchData();
      
//   return {
//     props: {
//       data: rows ?? [],
//     },
//   };
// };

export default Page;