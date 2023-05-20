import "./App.css";
import MapComponent from "./components/MapComponent2";
import areas from "./data/areas.json";

function App() {
  return (
    <div className="App">
      <MapComponent areaList={areas} />
    </div>
  );
}

export default App;
