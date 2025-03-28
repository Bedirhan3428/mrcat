import logo from './logo.svg';
import './App.css';
import Signup from './pages/Singup';
import Home from './pages/Home';
import { Routes, Route } from "react-router-dom";
import { ToastContainer, toast, configure } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function App() {

  return (
    <div className="App">
      <Routes>
      <Route path='/' element={<Signup />}/>
      <Route path='/sginup' element={<Home />}/>
      </Routes>
      <div>
      {/* Uygulamanızın diğer bileşenleri */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={true}
        closeOnClick={true}
        pauseOnHover
        draggable
        progress={undefined}
      />
    </div>
    </div>
  );
}

export default App;
