'use client'
import React, {  FC, useEffect, useMemo, useState } from "react";
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
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";

const containerStyle = {
  width: "100%",
  height: "calc(100vh - 50px)"
};

const defaultCenter = { lat: 43.85, lng: 18.40 };

const ConnectivityMap: FC<{schoolsAndTowers:PopulationData[], recommended: RecommendationDetailedType[]}> = ({schoolsAndTowers, recommended}) => {
  const [csvData, setCsvData] = useState<PopulationData[]>(schoolsAndTowers);
  const [selectedSchool, setSelectedSchool] = useState<PopulationData | null>(null);
  const [selectedTower, setSelectedTower] = useState<PopulationData | null>(null);
  const [selectedTopSchool, setSelectedTopSchool] = useState<{reccoumented: RecommendationDetailedType, school?: PopulationData} | null>(null);
  const topSchoolsData = useMemo(() => {
    const topSchoolsDataObject:{[x:string]:PopulationData} = {}
    schoolsAndTowers.filter(school=> recommended.find(rec=>rec.schoolId === school.school_id_giga)).forEach(school => topSchoolsDataObject[school.school_id_giga] = school)
    return topSchoolsDataObject;
  }, [recommended, schoolsAndTowers])
  const markersMemorised = useMemo(() => {
    return csvData ? csvData.filter(row => row.tower_lat && row.tower_lon && row.distance_km).map((row, idx) => {
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
    }): null;
  }, [csvData])
  console.log("topSchoolsData",topSchoolsData);
  useEffect(() => {
    setCsvData(schoolsAndTowers);
  }, [schoolsAndTowers]);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_ELEVATION_API_KEY ?? "",
  })

  // const [map, setMap] = React.useState<google.maps.Map | null>(null)

  // const onLoad = React.useCallback(function callback(map: google.maps.Map) {
  //   setMap(map)
  // }, [])

  // const onUnmount = React.useCallback(function callback() {
  //   setMap(null)
  // }, [])

  // const panToLocation = (lat: number, lng: number) => {
  //   if (map) {
  //     map.panTo({ lat, lng });
  //     map.setZoom(15);
  //   }
  // };

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
      <div className="flex-1 flex-col md:flex-row hidden md:flex sidebar">
      <aside className="w-full border-r border-[#CCCCCC] bg-white md:w-[400px] dark:bg-slate-900 overflow-y-auto">
          <div className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Top 5 Schools to connect</h2>
          <button
              className="bg-blue-500 text-white px-2 py-2 rounded sm:hidden"
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
        <Separator className="my-3" />
          </div>
          <div className="px-3">
        {recommended.map((school) => {
          return (
          <div
            key={school.schoolId}
            className={`mb-2 cursor-pointer rounded-lg p-1 transition-colors ${
          selectedSchool?.school_id_giga === school.schoolId
            ? "bg-blue-50 dark:bg-blue-950"
            : "hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            onClick={() => {setSelectedTopSchool({school: schoolsAndTowers.find(s => s.school_id_giga === school.schoolId) || undefined,reccoumented: school})}}
          >
            <Card
          className={`border-0 shadow-none ${
            selectedSchool?.school_id_giga === school.schoolId ? "bg-blue-50 dark:bg-blue-950" : "bg-transparent"
          }`}
            >
          <CardHeader className="p-3 pb-0">
            <div className="flex items-start justify-between">
              <div>
            <CardTitle className="text-base">{school.schoolName}</CardTitle>
            <CardDescription className="mt-1 text-xs">ID: {school.schoolId}</CardDescription>
              </div>
              <Badge
            variant="outline"
            className="text-md font-medium px-2.5 py-1 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedSchool(schoolsAndTowers.find(s => s.school_id_giga === school.schoolId) || null)
            }}
              >
            Locate
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Impact Score:</span>
              <span className="font-semibold text-blue-700 dark:text-blue-500">{school.scoreOfImpact}</span>
            </div>
            <Progress                      
              value={parseFloat(school.scoreOfImpact)}
              max={100}
              className="mt-1 h-1.5 bg-slate-200 dark:bg-slate-700"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline" className="font-normal text-xs">
            {school?.schoolId ? `${topSchoolsData?.[school.schoolId]?.distance_km} km` : "No data"}
              </Badge>
              <Badge variant="outline" className="font-normal text-xs">
                {school.recommendedSolutionEstimatedCost}
              </Badge>
            </div>
          </CardContent>
            </Card>
          </div>
        )
        })}
          </div>
          {/* <div className="mt-auto p-4">
        <Button className="w-full bg-blue-600 hover:bg-blue-700">Connect All Schools</Button>
          </div> */}
        </aside>
      </div>

      {/* Map Container */}
      <div  className="w-full h-full bg-white">
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
          >
            {markersMemorised}

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
            {selectedTopSchool && (
                <div className={`absolute left-4 top-4 md:w-[380px] rounded-lg border border-[#CCCCCC] bg-white p-4 shadow-lg dark:bg-slate-900 ${window.innerWidth < 768 ? 'fixed inset-0 m-4' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                  <h3 className="font-semibold">{selectedTopSchool.reccoumented.schoolName}</h3>
                  <p className="text-xs text-muted-foreground">ID: {selectedTopSchool.reccoumented.schoolId}</p>
                  </div>
                  <div className="flex flex-col items-end">
                  <button className=" text-2xl -mt-4 -mr-1 p-2 cursor-pointer"
                  onClick={()=>{
                    setSelectedTopSchool(null);
                  }}>x</button>
                  <Badge
                    variant="outline"
                    className="text-md font-medium bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 cursor-pointer"
                    onClick={() => {
                    if (selectedTopSchool?.school) {
                      setSelectedSchool(selectedTopSchool.school);
                      if(window.innerWidth < 768)
                        setSelectedTopSchool(null);
                    }
                    }
                    }
                  >
                    Locate
                  </Badge>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                  <p className="text-xs text-muted-foreground">Impact Score</p>
                  <p className="font-semibold text-blue-700 dark:text-blue-500">{selectedTopSchool.reccoumented.scoreOfImpact}</p>
                  </div>
                  <div>
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="font-bold">{`${selectedTopSchool?.school?.distance_km ?? "0"} km`}</p>
                  </div>
                  <div>
                  <p className="text-xs text-muted-foreground">Population</p>
                  <p className="font-bold">{selectedTopSchool?.school?.population_density??"0"}</p>
                  </div>
                  <div>
                  <p className="text-xs text-muted-foreground">Cost Estimation</p>
                  <p className="font-bold">{selectedTopSchool.reccoumented.recommendedSolutionEstimatedCost}</p>
                  </div>
                </div>

                <Separator className="my-3" />

                <div>
                  <p className="text-xs font-medium text-muted-foreground">Recommended Solution</p>
                  <p className="mt-1 text-xs leading-relaxed">{selectedTopSchool.reccoumented.recommendedSolutionWhy}</p>
                </div>

                <div className="mt-3 flex justify-end">
                  {/* <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Connect School
                  </Button> */}
                </div>
                </div>
            )}
            </GoogleMap>}
            
      </div>
    </div>
  );
};

export default ConnectivityMap;
