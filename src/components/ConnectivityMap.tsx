'use client'
import React, {  FC } from "react";
// import {
//   GoogleMap,
//   LoadScript,
//   Marker,
//   Polyline,
//   InfoWindow
// } from "@react-google-maps/api";
// import type { GoogleMap as GoogleMapType } from "@react-google-maps/api";
import { PopulationData } from "@/scripts/mergePopulationDenciryCsv";
import { RecommendationDetailedType } from "@/scripts/mergeRecommendationCsv";

// const containerStyle = {
//   width: "100%",
//   height: "100vh"
// };

// const defaultCenter = { lat: 43.85, lng: 18.40 };

const ConnectivityMap: FC<{schoolsAndTowers:PopulationData[], recommended: RecommendationDetailedType[]}> = ({ recommended}) => {
  // const [csvData, setCsvData] = useState<PopulationData[]>(schoolsAndTowers);
//   const [topSchools, setTopSchools] = useState<SchoolData[]>([]);
  // const [selectedSchool, setSelectedSchool] = useState<PopulationData | null>(null);
  // const [selectedTower, setSelectedTower] = useState<PopulationData | null>(null);
  // const [panPosition, setPanPosition] = useState<{ lat: number; lng: number }>(
  //   defaultCenter
  // );
  // const mapRef = useRef<GoogleMapType | null>(null);
  // const [schoolIcon, setSchoolIcon] = useState<any>(null);
  // const [towerIcon, setTowerIcon] = useState<any>(null);

  // const onMapLoad = (map: any) => {
  //   mapRef.current = map;
  // };

  // const panToLocation = (lat: number, lng: number) => {
  //   if (mapRef.current) {
  //     mapRef.current.panTo({ lat, lng });
  //   //   mapRef.current.setZoom(15);
  //   }
  // };

  // const handleMarkerClick = (row: PopulationData, type: "school" | "tower") => {
  //   if (type === "school") {
  //     setSelectedSchool(row);
  //     setSelectedTower(null);
  //   } else if (type === "tower") {
  //     setSelectedTower(row);
  //     setSelectedSchool(null);
  //   }
  // };

  // const handlePolylineClick = (distance?: string) => {
  //   if (distance) {
  //     alert(`Distance: ${distance} km`);
  //   } else {
  //     alert("Distance not available");
  //   }
  // };

  // Define custom marker icons if you have them (ensure these images exist in /public)

    // useEffect(() => {
    //     setSchoolIcon(window?.google?.maps ? {
    //         url: `${process.env.PUBLIC_URL}/school-icon.png`,
    //         scaledSize: new window.google.maps.Size(30, 30)
    //     } : null);

    //     setTowerIcon(window?.google?.maps ? {
    //         url: "/signal-tower.png",
    //         scaledSize: new window.google.maps.Size(30, 30)
    //     } : null);
    // }, []);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar with Top 5 Schools */}
      <div
        style={{
          width: "25%",
          padding: "10px",
          backgroundColor: "#f9f9f9",
          overflowY: "auto",
          height: "100vh"
        }}
      >
        <h3>Top 5 Schools to connect</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {recommended && recommended?.map((school, idx) => (
            <li
              key={idx}
              style={{
                marginBottom: "10px",
                padding: "5px",
                border: "1px solid #ccc",
                cursor: "pointer"
              }}
            //   onClick={() => {
            //     const lat = parseFloat(school.latitude);
            //     const lng = parseFloat(school.longitude);
            //     if (!isNaN(lat) && !isNaN(lng)) {
            //       panToLocation(lat, lng);
            //     }
            //   }}
            >
              <strong>{school.schoolName}</strong>
              <br />
              ID: {school.schoolId}
              <br />
              Impact Score: {school.scoreOfImpact}
              <br />
              Recommended Solution: {school.recommendedSolutionWhy}
              <br />
              Cost Estimation: {school.recommendedSolutionEstimatedCost}
            </li>
          ))}
        </ul>
      </div>

      {/* Map Container */}
      <div style={{ width: "75%", height: "100%" }}>
        
      </div>
    </div>
  );
};

export default ConnectivityMap;
