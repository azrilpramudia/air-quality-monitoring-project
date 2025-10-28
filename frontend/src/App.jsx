import Hero from "./components/Hero";
import SensorDetail from "./components/SensorDetail";
import Navbar from "./components/Navbar";
import AQIModal from "./components/AQIModal";
import SensorChartModal from "./components/SensorChartModal";
import Footer from "./components/Footer";

function App() {
  return (
    <>
      <Navbar />
      <Hero />
      <SensorDetail />
      <AQIModal />
      <SensorChartModal />
      <Footer />
    </>
  );
}

export default App;
