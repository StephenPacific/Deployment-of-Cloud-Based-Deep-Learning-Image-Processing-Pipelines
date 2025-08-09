import { useState, useEffect } from 'react';
import { Navigate, Routes, Route, BrowserRouter, useParams } from "react-router-dom";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from './pages/Dashboard.jsx';
import TrainAndInfer from './pages/TrainAndInfer.jsx';
import TrainPreview from './pages/TrainPreview.jsx';
import InferParameter from './pages/InferParameter.jsx';
import History from './pages/History.jsx';
import StartTask from './pages/StartTask.jsx';
import Profile from './pages/Profile.jsx'; 
import Preview from './pages/Preview.jsx';
import Preprocess from './pages/Preprocess.jsx';
import Output from './pages/Ouput.jsx';
import ForgetPassword from './pages/ForgetPassword.jsx';
import AdminPanel from "./pages/Admin.jsx"; // AddImport AdminPanel
import TrainingOptions from './pages/TrainingOptions.jsx'
import TrainingStage1 from './pages/TrainingStage1.jsx';
import TrainingStage2 from './pages/TrainingStage2.jsx';

// import EditPresentation from './pages/editPresentation.jsx'; // go to the edit presentation page
// import PresentationPreview from './pages/presentationPreview.jsx';// go to the presentation page

// // redirect the component
// function RedirectToFirstSlide() {
//   const { id } = useParams();
//   return <Navigate to={`/presentation/${id}/slide/1`} replace />;
// }

// function RedirectToFirstSlidePreview() {
//   const { id } = useParams();
//   return <Navigate to={`/preview/${id}/slide/1`} replace />;
// }

function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken !== null) {
      setToken(savedToken);
      console.log('token found', savedToken);
    } else {
      console.log('no token found');
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/register" replace />} />
        <Route path="/dashboard" element={<Dashboard token={token} setToken={setToken} />} /> 
        <Route path="/register" element={<Register token={token} setTokenFn={setToken} />} />
        <Route path="/login" element={<Login token={token} setTokenFn={setToken} />} />
        <Route path="/TrainAndInfer" element={<TrainAndInfer />} />
        <Route path="/TrainPreview" element={<TrainPreview />} /> 
        <Route path="/InferParameter" element={<InferParameter />} />
        <Route path="/history" element={<History />} />
        <Route path="/start" element={<StartTask />} />
        <Route path="/profile" element={<Profile token={token} setToken={setToken} />} />
        <Route path="/preview" element={<Preview token={token} setToken={setToken} />} />
        <Route path="/preprocess" element={<Preprocess token={token} setToken={setToken} />} />
        <Route path="/output" element={<Output token={token} setToken={setToken} />} />
        <Route path="/ForgetPassword" element={<ForgetPassword />} />
        <Route path="/admin" element={<AdminPanel />} /> {/* Admin route */}

        <Route path='/TrainingOptions' element={<TrainingOptions setToken={setToken} />} />
        <Route path='/TrainingStage1' element={<TrainingStage1 setToken={setToken} />} />
        <Route path='/TrainingStage2' element={<TrainingStage2 setToken={setToken} />} />
        {/* For the url */}
        {/* <Route 
          path="/presentation/:id/slide/:slideNumber" 
          element={<EditPresentation token={token} setToken={setToken} />} 
        />
        <Route 
          path="/preview/:id/slide/:slideNumber" 
          element={<PresentationPreview token={token} setToken={setToken} />} 
        /> */}

        {/* When there is no slideNumber, use the redirect component
        <Route path="/presentation/:id" element={<RedirectToFirstSlide />} />
        <Route path="/preview/:id" element={<RedirectToFirstSlidePreview />} /> */}

      </Routes>
    </BrowserRouter>
  );
}

export default App;

