'use client'
import React, {  FC, useEffect, useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  // LoadScript,
  Marker,
  Polyline,
  InfoWindow,
  Circle
} from "@react-google-maps/api";
// import type { GoogleMap as GoogleMapType } from "@react-google-maps/api";
import { PopulationData } from "@/scripts/mergePopulationDenciryCsv";
import { RecommendationDetailedType } from "@/scripts/mergeRecommendationCsv";

const containerStyle = {
  width: "100%",
  height: "100vh"
};

const defaultCenter = { lat: 43.85, lng: 18.40 };

const ConnectivityMap: FC<{schoolsAndTowers:PopulationData[], recommended: RecommendationDetailedType[]}> = ({schoolsAndTowers, recommended}) => {
  const [csvData, setCsvData] = useState<PopulationData[]>(schoolsAndTowers);
  // const [topSchools, setTopSchools] = useState<SchoolData[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<PopulationData | null>(null);
  const [selectedTower, setSelectedTower] = useState<PopulationData | null>(null);
  // const [panPosition, setPanPosition] = useState<{ lat: number; lng: number }>(
  //   defaultCenter
  // );

  useEffect(() => {
    setCsvData(schoolsAndTowers);
  }, [schoolsAndTowers]);

  const { isLoaded } = useJsApiLoader({
    // id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_ELEVATION_API_KEY ?? "",
  })

  const [map, setMap] = React.useState<google.maps.Map | null>(null)

  const onLoad = React.useCallback(function callback(map: google.maps.Map) {
    // This is just an example of getting and using the map instance!!! don't just blindly copy!
    // const bounds = new window.google.maps.LatLngBounds(defaultCenter)
    // map.fitBounds(bounds)

    setMap(map)
  }, [])

  const onUnmount = React.useCallback(function callback() {
    setMap(null)
  }, [])

  // const mapRef = useRef<GoogleMapType | null>(null);
  // const [schoolIcon, setSchoolIcon] = useState<any>(null);
  // const [towerIcon, setTowerIcon] = useState<any>(null);

  // const onMapLoad = (map: any) => {
  //   mapRef.current = map;
  // };

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
      <div style={{ width: "75%", height: "100%", backgroundColor: "#f9f9f9" }}>
      <h1 style={{ textAlign: "center", margin: "10px 0px",marginRight: "10px", backgroundColor: "#f0f0f0", fontSize: "2em", fontWeight: "bold" }}>Connect them all</h1>
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
               radius={parseFloat(selectedTower.range ?? "0")} // assuming range is in km
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
