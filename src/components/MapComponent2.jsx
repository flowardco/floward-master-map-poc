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
  editable: false,
  draggable: false,
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
  const [polygonsArray, setPolygonsArray] = useState([]);
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

  const onPolygonSelected = (polygon, selected = false) => {
    polygon.setOptions({
      editable: selected,
      draggable: selected,
      fillColor: selected ? "#116d87" : "#ffff00",
      strokeColor: selected ? "#116d87" : "#ffa500",
      fillOpacity: selected ? 0.6 : 0.4,
    });
  };

  const resetAllPolygonEditable = () => {
    console.log(polygonsArray);
    polygonsArray.forEach((polygon) => onPolygonSelected(polygon, false));
  };

  const updateAreaPolygonsData = (area, geoCordinates) => {
    if (isProcessingPolygons.current) {
      // todo - handle if already processing (edge case)
      console.error(
        "return if isProcessingPolygons.current",
        isProcessingPolygons.current
      );
    }
    //
    isProcessingPolygons.current = true;

    setAreaPolygons((val) => {
      const updatedData = val?.map((areaItem) => {
        if (areaItem.id === area.id) {
          return {
            ...areaItem,
            geoCordinates,
          };
        }
        return areaItem;
      });
      return updatedData;
    });

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

  const addPolygonsToArray = (polygon) => {
    setPolygonsArray((val) => val.concat(polygon));
  };

  const onPolygonAdded = (polygon, area) => {
    const convertedLatLng = convertPolygonArray(polygon);
    updateAreaPolygonsData(area, convertedLatLng);
    addPolygonsToArray(polygon);
  };

  const onAreaPolygonSelectFromMap = (area) => {
    // when polygon is clicked, trigger area selected from current polygon data,
    handleAreaClick(area);
  };

  const onPolygonUpdate = (polygon, area) => {
    const convertedLatLng = convertPolygonArray(polygon);
    updateAreaPolygonsData(area, convertedLatLng);
  };

  const handleDeletePolygon = (polygon, area) => {
    updateAreaPolygonsData(area, []);
    polygon.setMap(null);
    setPolygonsArray((val) =>
      val.filter(
        (polygonItem) =>
          polygonItem?.flowardArea?.id !== polygon?.flowardArea?.id
      )
    );
  };

  const initAllAreasPolygonOnMap = (areas, map, maps) => {
    if (areas && areas?.length > 0 && map && maps) {
      const preloadedPolygons = [];
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
            onAreaPolygonSelectFromMap(areaItem, areaItemPolygon);
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
          preloadedPolygons.push(areaItemPolygon);
        }
      });
      // add all polygons to the array
      addPolygonsToArray(preloadedPolygons);
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
    drawingManager.setMap(map);
    setGMapsDrawingManager(drawingManager);

    maps.event.addListener(drawingManager, "polygoncomplete", (polygon) => {
      const currentSlectedArea = selectedArea.current;
      if (currentSlectedArea) {
        // we associate each polygon with currently selected area
        polygon.flowardArea = currentSlectedArea;
        polygon.addListener("click", () =>
          onAreaPolygonSelectFromMap(currentSlectedArea, polygon)
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
        drawingManager.setOptions({
          drawingMode: null,
          drawingControlOptions: {
            drawingModes: [],
          },
        });
      } else {
        // Do not add any polygon if no currently selected item
        polygon.setMap(null);
      }
    });
  };

  const handleDrawingToolForArea = (drawingManager, area, maps, polygons) => {
    if (drawingManager && area && maps) {
      // before enabling polygon tool, we check if a polygon already added for this area or not
      // if added, don't enable polygon againn (to avoid adding multiple polygons to same area)
      const areaPolygon = polygons?.find(
        (polygon) => polygon?.flowardArea?.id === area?.id
      );
      const hasPolygon = !!areaPolygon;
      resetAllPolygonEditable();

      drawingManager.setOptions({
        drawingControlOptions: {
          drawingModes: hasPolygon ? [] : [gMaps.drawing.OverlayType.POLYGON],
        },
      });
      if (hasPolygon) {
        onPolygonSelected(areaPolygon, true);
      }
    } else if (drawingManager && gMaps) {
      drawingManager.setOptions({
        drawingMode: null,
        drawingControlOptions: {
          drawingModes: [],
        },
      });
    }
  };

  const handleMapApiLoaded = (map, maps) => {
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
    handleDrawingToolForArea(
      gMapsDrawingManager,
      currentArea,
      gMaps,
      polygonsArray
    );
  }, [gMapsDrawingManager, currentArea, gMaps, polygonsArray]);

  console.log(polygonsArray, areaPolygons);

  const AreaListComp = ({ area }) => {
    const isSelected = currentArea?.id === area.id || false;
    const areaPolygon =
      polygonsArray?.find((polygon) => polygon?.flowardArea?.id === area?.id) ||
      null;
    return (
      <>
        <div
          onClick={() => handleAreaClick(area)}
          className={`areaListItem ${isSelected ? "selected" : ""}`}
        >
          <div className="areaListItemTitle">
            <span>
              {area.id} - {area.name}
            </span>
            {areaPolygon ? (
              <button onClick={() => handleDeletePolygon(areaPolygon, area)}>
                Delete Polygon
              </button>
            ) : null}
          </div>
          <pre className="areaListItemCordinate">
            {JSON.stringify(area.geoCordinates, null, 2)}
          </pre>
        </div>
      </>
    );
  };

  return (
    <>
      <div className="page-header">
        <button type="button" onClick={toggleHeatMap}>
          Toggle Heat Map
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
            onGoogleApiLoaded={({ map, maps }) => handleMapApiLoaded(map, maps)}
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
                <AreaListComp area={itm} key={itm.id} />
              ))}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default MapComponent2;
