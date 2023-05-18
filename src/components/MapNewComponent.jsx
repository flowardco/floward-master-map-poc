import { useState, useCallback } from 'react';
import { GoogleMap, DrawingManager } from '@react-google-maps/api';
const containerStyle = {
    width: "70%",
    height: "calc(100vh - 60px)",
    float: 'left'
};

const center = {
    lat: 25.168282,
    lng: 55.250286,
};
const MapNewComponent = () => {

    const [selectedShape, setSelectedShape] = useState(null);
    const [map, setMap] = useState(null);
    const [selectedColor, setSelectedColor] = useState('#1E90FF');
    const [drawingOptions, setDrawingOptions] = useState({
        drawingControl: true,
        drawingControlOptions: {
            drawingModes: ['polygon'],
        },
        circleOptions: {
            fillColor: selectedColor,
            fillOpacity: 0.45,
            strokeWeight: 0,
        },
        polygonOptions: {
            fillColor: selectedColor,
            fillOpacity: 0.45,
            strokeWeight: 0,
        },
        rectangleOptions: {
            fillColor: selectedColor,
            fillOpacity: 0.45,
            strokeWeight: 0,
        },
    });
    const onLoad = (map) => {
        setTimeout(() => {
            setMap(map);
        }, 1000);

        // window.google.maps.event.addListenerOnce(map, 'tilesloaded', () => {
        //   setMap(map);
        // });
    };
    const onPolygonComplete = useCallback((polygon) => {
        setSelectedShape(polygon);
    }, []);

    const onCircleComplete = useCallback((circle) => {
        setSelectedShape(circle);
    }, []);

    const onRectangleComplete = useCallback((rectangle) => {
        setSelectedShape(rectangle);
    }, []);

    const clearSelection = useCallback(() => {
        if (selectedShape) {
            setSelectedShape(null);
        }
    }, [selectedShape]);

    const deleteSelectedShape = useCallback(() => {
        if (selectedShape) {
            selectedShape.setMap(null);
            clearSelection();
        }
    }, [selectedShape, clearSelection]);

    const selectColor = useCallback((color) => {
        setSelectedColor(color);
        if (selectedShape) {
            if (selectedShape.setOptions) {
                selectedShape.setOptions({
                    fillColor: color,
                });
            }
        }
    }, [selectedShape]);

    const buildColorPalette = useCallback(() => {
        const colors = ['#1E90FF', '#FF1493', '#32CD32', '#FF8C00', '#4B0082'];
        const colorButtons = colors.map((color) => {
            return (
                <button
                    key={color}
                    className="color-button"
                    style={{ backgroundColor: color, border: color === selectedColor ? '2px solid #789' : '2px solid #fff' }}
                    onClick={() => selectColor(color)}
                ></button>
            );
        });
        return <div id="color-palette">{colorButtons}</div>;
    }, [selectedColor, selectColor]);

    return (
        <div>
            <GoogleMap
                onLoad={onLoad}
                mapContainerStyle={containerStyle}
                center={center}
                zoom={10}
            >
                <DrawingManager
                    options={drawingOptions}
                    onPolygonComplete={onPolygonComplete}
                    onCircleComplete={onCircleComplete}
                    onRectangleComplete={onRectangleComplete}
                />
            </GoogleMap>
            <div id="delete-button" onClick={deleteSelectedShape}>
                Delete Shape
            </div>
            {buildColorPalette()}
        </div>
    );
}

export default MapNewComponent;