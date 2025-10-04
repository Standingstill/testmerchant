import { Route, Routes } from 'react-router-dom';
import ProductPage from './pages/ProductPage';
import SuccessPage from './pages/SuccessPage';
import ErrorPage from './pages/ErrorPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ProductPage />} />
      <Route path="/success" element={<SuccessPage />} />
      <Route path="/error" element={<ErrorPage />} />
    </Routes>
  );
}

export default App;
