// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import './App.css';
// import Home from './components/Home';
// import Analysis from './components/Analysis';
// import QuestionsPattern from './components/questions_pattern';
// import AnalysisResults from './components/AnalysisResults';

// function App() {
//   return (
//     <Router>
//       <div className="App">
//         <Routes>
//           <Route path="/" element={<Home />} />
//           <Route path="/analysis" element={<Analysis />} />
//           <Route path="/questions" element={<QuestionsPattern />} />
//           <Route path="/analysis-results" element={<AnalysisResults />} />
//         </Routes>
//       </div>
//     </Router>
//   );
// }

// export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Analysis from './components/Analysis';
import QuestionsPattern from './components/questions_pattern';
import AnalysisResults from './components/AnalysisResults';
import Visualize from './components/visualize';
import Login from './components/Login';
import SchoolWise from './components/school_wise';
import UploadFile from './components/upload_file';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analysis" 
            element={
              <ProtectedRoute>
                <Analysis />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/visualize" 
            element={
              <ProtectedRoute>
                <Visualize />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/questions" 
            element={
              <ProtectedRoute>
                <QuestionsPattern />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analysis-results" 
            element={
              <ProtectedRoute>
                <AnalysisResults />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/school-wise" 
            element={
              <ProtectedRoute>
                <SchoolWise />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/upload" 
            element={
              <ProtectedRoute>
                <UploadFile />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;