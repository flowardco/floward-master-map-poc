import React, { useEffect, useState } from "react";
import GoogleMapReact from "google-map-react";
import { GoogleMap, useJsApiLoader, Polygon, DrawingManager, HeatmapLayer } from "@react-google-maps/api";

const containerStyle = {
  width: "70%",
  height: "calc(100vh - 60px)",
  float: 'left'
};

const center = {
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

const MapComponent = () => {
  const [map, setMap] = useState(null);
  const [polygons, setPolygons] = useState([]);
  const [heatmap, setHeatmap] = useState(false);

  const onLoad = (map) => {
    setTimeout(() => {
      setMap(map);
    }, 1000);

    // window.google.maps.event.addListenerOnce(map, 'tilesloaded', () => {
    //   setMap(map);
    // });
  };

  const onPolygonComplete = (polygon) => {
    setPolygons([...polygons, polygon]);
    window.google.maps.event.addListener(polygon, 'mouseup', () => {
      console.log('Polygon edited:', polygon);
    });
  };

  const deletePolygon = (index) => {
    console.log(index);
    const newPolygons = [...polygons];
    newPolygons.splice(index, 1);
    setPolygons(newPolygons);
  };

  const toggleHeatmap = () => {
    setHeatmap(!heatmap);
  };

  const updatePolygon = () => {
    polygons.forEach((polygon, index) => {

      window.google.maps.event.addListener(polygon.getPath(), 'set_at', (event, obj) => {
        const newPolygons = [...polygons];
        const previousPolygon = newPolygons[index];

        newPolygons[index] = new window.google.maps.Polygon({
          ...polygonOptions,
          paths: polygon.getPath().getArray(),
        });
        previousPolygon.setMap(null);
        setPolygons(newPolygons);
      });

      window.google.maps.event.addListener(polygon.getPath(), 'insert_at', (event, obj) => {
        const newPolygons = [...polygons];
        const previousPolygon = newPolygons[index];

        newPolygons[index] = new window.google.maps.Polygon({
          ...polygonOptions,
          paths: polygon.getPath().getArray(),
        });
        previousPolygon.setMap(null);
        setPolygons(newPolygons);
      });

      window.google.maps.event.addListener(polygon.getPath(), 'remove_at', (event) => {
        const newPolygons = [...polygons];
        const previousPolygon = newPolygons[index];
        newPolygons[index] = new window.google.maps.Polygon({
          ...polygonOptions,
          paths: polygon.getPath().getArray(),
        });
        previousPolygon.setMap(null);
        setPolygons(newPolygons);
      });
      if (polygon.getEditable()) {
        setMap(null)
      }
    });
  }
  useEffect(() => {

    if (map) {
      updatePolygon();
    }
    return () => {
      if (map) {
        window.google.maps.event.clearListeners(map, 'insert_at');
        window.google.maps.event.clearListeners(map, 'set_at');
        window.google.maps.event.clearListeners(map, 'remove_at');
      }
    }
  }, [map, polygons]);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyDW3CyzS8Bfl5FfCC3j9RaF5shuGhAQz9o",
    libraries: ['drawing', 'visualization'],
  });
  console.log(polygons);
  return isLoaded ? (
    <>
      <GoogleMap
        onLoad={onLoad}
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
      >
        <>
          {polygons.map((polygon, index) => (
            <Polygon
              key={`polygon-${index}`}
              path={polygon.getPath()}
              options={polygonOptions}
              onClick={() => deletePolygon(index)}
              editable={true}
              onMouseUp={(e) => { console.log(e.latLng.lat()) }}
            />
          ))}
        </>

        {heatmap && <HeatmapLayer />}
        {map && (
          <DrawingManager
            onPolygonComplete={onPolygonComplete}
            on
            drawingControl={true}
            drawingControlOptions={{
              position: window.google.maps.ControlPosition.TOP_CENTER,
              drawingModes: ["polygon"],
            }}
          />
        )}
      </GoogleMap>
      <div>
        <h1>test</h1>
        <button onClick={toggleHeatmap}>{heatmap ? "Show Polygons" : "Show Heatmap"}</button>

        <ul>
          {polygons.map((polygon, index) => (
            <li key={`polygon-list-${index}`}>
              {`Polygon ${index + 1}: (${polygon.getPath()
                .getArray()
                .map((point) => `${point.lat()}, ${point.lng()}`)
                .join(', ')})`}
            </li>
          ))}
        </ul>
      </div>
    </>
  ) : (
    <></>
  );
};

export default MapComponent;