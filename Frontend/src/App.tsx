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
import { Toaster } from 'react-hot-toast';
import FAQ from './pages/FAQ';
import FeaturesPage from './pages/FeaturesPage';
import EditGeneration from './pages/EditGeneration';


function App() {
	return (
		<>
			<Toaster toastOptions={{style:{background:"#333",color:"#fff"}}}/>
			<SoftBackdrop />
			<LenisScroll />
			<Navbar />
			
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/community" element={<Community />} />
				<Route path="/plans" element={<Plans />} />
				<Route path="/faq" element={<FAQ />} />
				<Route path="/features" element={<FeaturesPage />} />
				<Route path="/generate" element={<Generator />} />
				<Route path="/my-generations" element={<MyGenerations />} />
				<Route path="/result/:projectId" element={<Result />} />
				<Route path="/edit/:projectId" element={<EditGeneration />} />
				<Route path="/loading" element={<Loading />} />
			</Routes>

			<Footer />
		</>
	);
}
export default App;