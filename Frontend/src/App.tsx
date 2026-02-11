import Navbar from './components/Navbar';
import Home from './pages/Home';
import SoftBackdrop from './components/SoftBackdrop';
import Footer from './components/Footer';
import LenisScroll from './components/lenis';
import { Route, Routes } from 'react-router-dom';
import Result from './pages/Result';
import Community from './pages/Community';
import Plans from './pages/Plans';
import Generator from './pages/Generator';
import MyGenerations from './pages/MyGenerations';
import Loading from './pages/Loading';

function App() {
	return (
		<>
			<SoftBackdrop />
			<LenisScroll />
			<Navbar />
			
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/community" element={<Community />} />
				<Route path="/plans" element={<Plans />} />
				<Route path="/generate" element={<Generator />} />
				<Route path="/my-generations" element={<MyGenerations />} />
				<Route path="/result/:id" element={<Result />} />
				<Route path="/loading" element={<Loading />} />
			</Routes>

			<Footer />
		</>
	);
}
export default App;