import Navbar from "./components/UI/Navbar";
import Footer from "./components/UI/Footer";
import Hero from "./components/Hero/Hero";
import SensorDetail from "./components/SensorDetail/SensorDetail";
import AQIModal from "./components/Modals/AQIModal";
import SensorChartModal from "./components/Modals/SensorChartModal";

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
