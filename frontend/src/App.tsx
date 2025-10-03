import { Route, Routes } from 'react-router-dom';
import ProductPage from './pages/ProductPage';
import SuccessPage from './pages/SuccessPage';
import CancelPage from './pages/CancelPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ProductPage />} />
      <Route path="/success" element={<SuccessPage />} />
      <Route path="/cancel" element={<CancelPage />} />
    </Routes>
  );
}

export default App;
