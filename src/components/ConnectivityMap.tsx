'use client'
import React, {  FC, useEffect, useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Polyline,
  InfoWindow,
  Circle
} from "@react-google-maps/api";
import { PopulationData } from "@/scripts/mergePopulationDenciryCsv";
import { RecommendationDetailedType } from "@/scripts/mergeRecommendationCsv";

const containerStyle = {
  width: "100%",
  height: "calc(100vh - 50px)"
};

const defaultCenter = { lat: 43.85, lng: 18.40 };

const ConnectivityMap: FC<{schoolsAndTowers:PopulationData[], recommended: RecommendationDetailedType[]}> = ({schoolsAndTowers, recommended}) => {
  const [csvData, setCsvData] = useState<PopulationData[]>(schoolsAndTowers);
  const [selectedSchool, setSelectedSchool] = useState<PopulationData | null>(null);
  const [selectedTower, setSelectedTower] = useState<PopulationData | null>(null);

  useEffect(() => {
    setCsvData(schoolsAndTowers);
  }, [schoolsAndTowers]);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_ELEVATION_API_KEY ?? "",
  })

  const [map, setMap] = React.useState<google.maps.Map | null>(null)

  const onLoad = React.useCallback(function callback(map: google.maps.Map) {
    setMap(map)
  }, [])

  const onUnmount = React.useCallback(function callback() {
    setMap(null)
  }, [])

  const panToLocation = (lat: number, lng: number) => {
    if (map) {
      map.panTo({ lat, lng });
      map.setZoom(15);
    }
  };

  const handleMarkerClick = (row: PopulationData, type: "school" | "tower") => {
    if (type === "school") {
      setSelectedSchool(row);
      setSelectedTower(null);
    } else if (type === "tower") {
      setSelectedTower(row);
      setSelectedSchool(null);
    }
  };

  const handlePolylineClick = (distance?: string) => {
    if (distance) {
      alert(`Distance: ${distance} km`);
    } else {
      alert("Distance not available");
    }
  };
  console.log("selectedSchool",selectedSchool)

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar with Top 5 Schools */}
      <div className={`w-[400px] md:w-1/4 p-2 bg-gray-100 overflow-y-auto h-full sidebar hidden sm:block`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Top 5 Schools to connect</h3>
          <div className="md:hidden">
            <button
              className="bg-blue-500 text-white px-2 py-2 rounded"
              onClick={() => {
                const sidebar = document.querySelector('.sidebar');
                const menuSlider = document.querySelector('.menu-slider');
                if (sidebar) {
                if (sidebar.classList.contains('hidden')) {
                  sidebar.classList.remove('hidden');
                } else {
                  sidebar.classList.add('hidden');
                }}
                if (menuSlider) {
                  if (menuSlider.classList.contains('hidden')) {
                    menuSlider.classList.remove('hidden');
                  } else {
                    menuSlider.classList.add('hidden');
                  }}
              }}
            >
              Slide
            </button>
          </div>
        </div>
        <ul className={`list-none p-0 m-0`}>
          {recommended && recommended?.map((school, idx) => (
        <li
          key={idx}
          className={`mb-2 p-2 border ${selectedSchool?.school_id_giga === school.schoolId ? "border-red-500" : "border-gray-300"} cursor-pointer box-border`}
          onClick={() => {
            const lat = parseFloat(school.lat);
            const lng = parseFloat(school.lon);
            if (!isNaN(lat) && !isNaN(lng)) {
          panToLocation(lat, lng);
            }
          }}
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
      <div style={{ width: "100%", height: "100%", backgroundColor: "#f9f9f9" }}>
        <div className="flex justify-between items-center">
        <div><button
              className="bg-blue-500 text-white px-2 py-2 rounded ml-4 menu-slider sm:hidden"
              onClick={() => {
                const sidebar = document.querySelector('.sidebar');
                const menuSlider = document.querySelector('.menu-slider');
                if (sidebar) {
                if (sidebar.classList.contains('hidden')) {
                  sidebar.classList.remove('hidden');
                } else {
                  sidebar.classList.add('hidden');
                }}
                if (menuSlider) {
                  if (menuSlider.classList.contains('hidden')) {
                    menuSlider.classList.remove('hidden');
                  } else {
                    menuSlider.classList.add('hidden');
                  }}
              }}
            >Slide</button></div>
      <h1 className="flex py-2 text-center center my-2 mx-0 mr-2 text-3xl font-bold">Connect them all</h1>
      <div className="w-5"/>
      </div>

      {isLoaded && <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultCenter}
            zoom={15}
            onLoad={onLoad}
            onUnmount={onUnmount}
          >
            {csvData.filter(row => row.tower_lat && row.tower_lon && row.distance_km).map((row, idx) => {
              if (!row.latitude || !row.longitude || !row.tower_lat || !row.tower_lon) return null;
              const schoolLat = parseFloat(row.latitude);
              const schoolLng = parseFloat(row.longitude);
              const towerLat = parseFloat(row.tower_lat);
              const towerLng = parseFloat(row.tower_lon);
              const range = parseFloat(row.range ?? "0");
              const distance = row.distance_km; // assuming field "distance" exists
              if (
                isNaN(range) ||
                isNaN(schoolLat) ||
                isNaN(schoolLng) ||
                isNaN(towerLat) ||
                isNaN(towerLng)
              )
                return null;
              return (
                <React.Fragment key={idx}>
                  {/* School Marker */}
                  <Marker
                    position={{ lat: schoolLat, lng: schoolLng }}
                    icon={{
                      url: "/school-icon.png",
                      scaledSize: new window.google.maps.Size(30, 30)
                    }}
                    onClick={() => handleMarkerClick(row, "school")}
                  />
                  <Marker
                    position={{ lat: towerLat, lng: towerLng }}
                    icon={{
                      url: "/signal-tower.png",
                      scaledSize: new window.google.maps.Size(30, 30)
                    }}
                    onClick={() => handleMarkerClick(row, "tower")}
                  />
                 
                  {/* Polyline connecting school and tower */}
                  <Polyline
                    path={[
                      { lat: schoolLat, lng: schoolLng },
                      { lat: towerLat, lng: towerLng }
                    ]}
                    options={{ strokeColor: "blue", strokeWeight: 2 }}
                    onClick={() => handlePolylineClick(distance)}
                  />
                </React.Fragment>
              );
            })}

            {/* InfoWindow for selected school */}
            {selectedSchool && (
              <InfoWindow
                position={{
                  lat: parseFloat(selectedSchool.latitude),
                  lng: parseFloat(selectedSchool.longitude)
                }}
                onCloseClick={() => setSelectedSchool(null)}
              >
                <div style={{ padding: "10px", maxWidth: "200px" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "bold" }}>
                  {selectedSchool.school_name}
                  </h4>
                  <p style={{ margin: "0 0 5px 0", fontSize: "14px" }}>
                  <strong>Education Level:</strong> {selectedSchool.education_level}
                  </p>
                  <p style={{ margin: "0", fontSize: "14px" }}>
                  <strong>Population Density:</strong> {selectedSchool.population_density}
                  </p>
                </div>
              </InfoWindow>
            )}

            {/* InfoWindow for selected tower */}
            {selectedTower && selectedTower.tower_lat && selectedTower.tower_lon &&  (
              <><InfoWindow
                position={{
                  lat: parseFloat(selectedTower.tower_lat),
                  lng: parseFloat(selectedTower.tower_lon)
                }}
                onCloseClick={() => setSelectedTower(null)}
              >
                <div style={{ padding: "10px", maxWidth: "200px" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "bold" }}>Tower Station Data</h4>
                  <p style={{ margin: "0 0 5px 0", fontSize: "14px" }}><strong>Radio:</strong> {selectedTower.radio}</p>
                  <p style={{ margin: "0", fontSize: "14px" }}><strong>Range:</strong> {selectedTower.range}</p>
                </div>
              </InfoWindow>
               {/* Circle around tower */}
               <Circle
                center={{ lat: parseFloat(selectedTower.tower_lat), lng: parseFloat(selectedTower.tower_lon) }}
                radius={parseFloat(selectedTower.range ?? "0")}
                options={{
                  strokeColor: "red",
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  fillColor: "transparent",
                  fillOpacity: 0,
                }}
             /></>
            )}
            </GoogleMap>}
      </div>
    </div>
  );
};

export default ConnectivityMap;
