import logo from './logo.svg';
import './App.css';
import Signup from './pages/Singup';
import Home from './pages/Home';
import { Routes, Route } from "react-router-dom";
import { ToastContainer, toast, configure } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NotFoundPage from './pages/NotFoundPage';
import CreateTeam from './pages/CreateTeam';
import Admin from './pages/Admin';


function App() {

  return (
    <div className="App">
      <Routes>
      <Route path='/' element={<Home />}/>
      <Route path='/home/:id' element={<Home />}/>
      <Route path='/singup' element={<Signup />}/>
      <Route path='/create-team' element={<CreateTeam />}/>
      <Route path='/admin' element={<Admin />}/>

      <Route path='*' element={<NotFoundPage />}/>
     
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