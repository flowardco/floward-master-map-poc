/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from "react";
import GoogleMapReact from "google-map-react";

import heatMapData from "../data/heatMapData.json";
import heatMapData2 from "../data/heatMapDataWithWeight.json";

const defaultCenter = {
  lat: 25.168282,
  lng: 55.250286,
};

const polygonOptions = {
  fillColor: "#ffff00",
  fillOpacity: 0.4,
  strokeColor: "#ffa500",
  strokeOpacity: 1,
  strokeWeight: 2,
  clickable: true,
  editable: true,
  draggable: true,
  zIndex: 1,
};

const MapComponent2 = ({ areaList = [] }) => {
  const mapRef = useRef();
  const [gMap, setGMap] = useState(null);
  const [gMaps, setGMaps] = useState(null);
  const [gMapsDrawingManager, setGMapsDrawingManager] = useState(null);
  const [currentArea, setCurrentArea] = useState(null);
  const selectedArea = useRef();
  const isProcessingPolygons = useRef();
  const [areaPolygons, setAreaPolygons] = useState(areaList);
  const [heatMapPositions, setHeatMapPositions] = useState(heatMapData);
  const [enableHeadMap, setEnableHeadMap] = useState(false);

  const toggleHeatMap = () => {
    setEnableHeadMap((val) => !val);
  };
  const showHeatMapWithWeightage = () => {
    setHeatMapPositions(heatMapData2);
  };
  const showHeatMapWithOutWeightage = () => {
    setHeatMapPositions(heatMapData);
  };

  const handleAreaClick = (area) => {
    setCurrentArea(area);
    selectedArea.current = area;
  };

  const updateAreaPolygonsData = (area, geoCordinates) => {
    if (isProcessingPolygons.current) {
      console.log(
        "return if isProcessingPolygons.current",
        isProcessingPolygons.current
      );
    }
    //
    isProcessingPolygons.current = true;
    const updatedData = areaPolygons?.map((areaItem) => {
      if (areaItem.id !== area.id) {
        return areaItem;
      }
      return {
        ...areaItem,
        geoCordinates,
      };
    });
    setAreaPolygons(updatedData);
    isProcessingPolygons.current = false;
  };

  const convertPolygonArray = (polygon) => {
    const latLngs = polygon?.getPath()?.getArray() || [];
    const convertedLatLng = latLngs?.reduce(
      (acc, itm) =>
        acc.concat({
          lat: itm.lat(),
          lng: itm.lng(),
        }),
      []
    );
    return convertedLatLng;
  };

  const onPolygonAdded = (polygon, area) => {
    const convertedLatLng = convertPolygonArray(polygon);
    updateAreaPolygonsData(area, convertedLatLng);
  };

  const onAreaPolygonSelectFromMap = (event, area) => {
    console.log("onAreaPolygonSelectFromMap", event, area);
  };

  const onPolygonUpdate = (polygon, area) => {
    const convertedLatLng = convertPolygonArray(polygon);
    updateAreaPolygonsData(area, convertedLatLng);
  };

  const initAllAreasPolygonOnMap = (areas, map, maps) => {
    if (areas && areas?.length > 0 && map && maps) {
      areas.forEach((areaItem) => {
        const areaItemPolygonData = areaItem?.geoCordinates || [];
        // check if have lat lng for area polygon
        if (areaItemPolygonData?.length > 0) {
          // show polygon only if we have lat lng saved for area
          const areaItemPolygon = new maps.Polygon({
            paths: areaItemPolygonData,
            ...polygonOptions,
            flowardArea: areaItem,
          });
          areaItemPolygon.setMap(map);

          areaItemPolygon.addListener("click", () => {
            onAreaPolygonSelectFromMap(areaItemPolygon, areaItem);
          });

          maps.event.addListener(areaItemPolygon.getPath(), "set_at", () => {
            onPolygonUpdate(areaItemPolygon, areaItem);
          });

          maps.event.addListener(areaItemPolygon.getPath(), "insert_at", () => {
            onPolygonUpdate(areaItemPolygon, areaItem);
          });

          maps.event.addListener(areaItemPolygon.getPath(), "remove_at", () => {
            onPolygonUpdate(areaItemPolygon, areaItem);
          });
        }
      });
    }
  };

  const initDrawingTools = (map, maps) => {
    const drawingManager = new maps.drawing.DrawingManager({
      drawingMode: null, // default to null so that user need to select the polygon from tool
      drawingControl: true,
      drawingControlOptions: {
        position: maps.ControlPosition.TOP_CENTER,
        drawingModes: [maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions,
    });
    maps.event.addListener(drawingManager, "polygoncomplete", (polygon) => {
      const currentSlectedArea = selectedArea.current;
      if (currentSlectedArea) {
        // we associate each polygon with currently selected area
        polygon.flowardArea = currentSlectedArea;
        polygon.addListener("click", () =>
          onAreaPolygonSelectFromMap(polygon, currentSlectedArea)
        );
        maps.event.addListener(polygon.getPath(), "set_at", () => {
          onPolygonUpdate(polygon, currentSlectedArea);
        });
        maps.event.addListener(polygon.getPath(), "insert_at", () => {
          onPolygonUpdate(polygon, currentSlectedArea);
        });
        maps.event.addListener(polygon.getPath(), "remove_at", () => {
          onPolygonUpdate(polygon, currentSlectedArea);
        });
        onPolygonAdded(polygon, currentSlectedArea);
      } else {
        // Do not add any polygon if no currently selected item
        polygon.setMap(null);
      }
    });
    drawingManager.setMap(map);
    setGMapsDrawingManager(drawingManager);
  };

  const handleApiLoaded = (map, maps) => {
    setGMap(map);
    setGMaps(maps);
  };

  // initialize drawing tool once we have google maps initiallized
  useEffect(() => {
    if (gMap && gMaps) {
      initDrawingTools(gMap, gMaps);
    }
  }, [gMap, gMaps]);

  useEffect(() => {
    if (gMap && gMaps && areaList && areaList.length > 0) {
      initAllAreasPolygonOnMap(areaList, gMap, gMaps);
    }
  }, [gMap, gMaps, areaList]);

  // Toggle Drawing tool once an area is selected and we have initialized
  useEffect(() => {
    if (gMapsDrawingManager && currentArea && gMaps) {
      gMapsDrawingManager.setOptions({
        drawingControlOptions: {
          drawingModes: [gMaps.drawing.OverlayType.POLYGON],
        },
      });
    } else if (gMapsDrawingManager && gMaps) {
      gMapsDrawingManager.setOptions({
        drawingControlOptions: {
          drawingModes: [],
        },
      });
    }
  }, [gMapsDrawingManager, currentArea, gMaps]);

  const AreaListComp = ({ itm }) => (
    <>
      <div
        onClick={() => handleAreaClick(itm)}
        className={`areaListItem ${
          currentArea?.id === itm.id ? "selected" : ""
        }`}
      >
        <span className="areaListItemTitle">
          {itm.id} - {itm.name}
        </span>
        <pre className="areaListItemCordinate">
          {JSON.stringify(itm.geoCordinates, null, 2)}
        </pre>
      </div>
    </>
  );

  return (
    <>
      <div className="page-header">
        <button type="button" onClick={toggleHeatMap}>
          Turn On Heat Map
        </button>
        <button type="button" onClick={showHeatMapWithWeightage}>
          Heat Map With Weightage
        </button>
        <button type="button" onClick={showHeatMapWithOutWeightage}>
          Heat Map Without Weightage
        </button>
      </div>
      <div className="page-wrapper">
        <div className="map-holder">
          <GoogleMapReact
            ref={mapRef}
            bootstrapURLKeys={{
              key: "AIzaSyDW3CyzS8Bfl5FfCC3j9RaF5shuGhAQz9o",
              libraries: ["visualization", "drawing"],
            }}
            heatmapLibrary={enableHeadMap}
            defaultCenter={defaultCenter}
            defaultZoom={11}
            yesIWantToUseGoogleMapApiInternals
            onGoogleApiLoaded={({ map, maps }) => handleApiLoaded(map, maps)}
            heatmap={{
              positions: enableHeadMap ? heatMapPositions : [],
              options: {
                radius: 30,
                opacity: 0.9,
              },
            }}
          />
        </div>
        <div className="arealist-holder">
          {/* Only render area list once All google maps api have been loaded */}
          {gMap && gMaps && gMapsDrawingManager ? (
            <>
              {areaPolygons?.map((itm) => (
                <AreaListComp itm={itm} key={itm.id} />
              ))}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default MapComponent2;
