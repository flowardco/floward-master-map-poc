import logo from './logo.svg';
import './App.css';
import MapComponent from './components/MapComponent';

function App() {
  const handlePolygonAdded = polygon => {
    console.log("Polygon added:", polygon);
  };

  const handlePolygonEdited = polygon => {
    console.log("Polygon edited:", polygon);
  };

  const handlePolygonDeleted = polygon => {
    console.log("Polygon deleted:", polygon);
  };
  return (
    <div className="App">
      <MapComponent />
    </div>
  );
}

export default App;
