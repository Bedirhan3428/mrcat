import React, { use } from 'react';
import { createUserWithEmailAndPassword , getAuth , GoogleAuthProvider , signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../FirebaseConfig'; // Dışa aktarılan auth nesnesini kullanın
import { useNavigate } from 'react-router-dom'
import '../css/singup.css' // CSS dosyasını içe aktarın'
import { FcGoogle } from "react-icons/fc";
import { getDatabase, push, ref, set, update } from "firebase/database"



function Singup() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [userName, setUserName] = React.useState('');
  const [cinsiyet, setCinsiyet] = React.useState(''); // Cinsiyet durumu
  const [showUserandCinsiyet, setShowUserandCinsiyet] = React.useState(true); 
  const [showUserandCinsiyet2, setShowUserandCinsiyet2] = React.useState(false);
  const [admin, setAdmin] = React.useState(false); // Admin durumu
  const [errorMessage, setErrorMessage] = React.useState(''); // Hata mesajları için state eklendi


  const navigate = useNavigate();
  const database = getDatabase();

  const girsyap = () => {
    setShowUserandCinsiyet(!showUserandCinsiyet); 
    setErrorMessage(''); // Geçiş yaparken hata mesajını sıfırla
  }
  


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Kayıt başarılı oldu
      const user = userCredential.user;
      const userId = user.uid; // Kullanıcı kimliği
      console.log(user.uid); // Kullanıcı kimliğini konsola yazdır
    
      setEmail('')
      setPassword('')
      const kullaniciBilgileri = {
        userName: userName,
        userId: userId,}


      navigate(`/` , { state: kullaniciBilgileri }); 
       // Kullanıcı kimliğini duruma ayarla
      console.log(userId); // Kullanıcı kimliğini konsola yazdır
      veriYaz(userId) // Kullanıcı bilgilerini veritabanına yaz;

    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Kayıt hatası:', errorCode, errorMessage);
      setErrorMessage(translateError(errorCode)); // Hata mesajını çevir ve state'e ekle
    }
  };


  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider(); // Google giriş sağlayıcısı oluştur
    try {
      const result = await signInWithPopup(auth, provider);
      // Giriş başarılı oldu
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      const user = result.user;
      console.log('Google ile giriş başarılı:', user.uid);
      navigate('/'); // Başarılı giriş sonrası yönlendirme (isteğe bağlı)
      
    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      const email = error.customData?.email;
      const credential = GoogleAuthProvider.credentialFromError(error);
      console.error('Google ile giriş hatası:', errorCode, errorMessage, email, credential);
      setErrorMessage(translateError(errorCode)); // Hata mesajını çevir ve state'e ekle
    }
  };


  const veriYaz = (userId)=>{
    const UserinfoRef = ref(database, 'users/' + userId);
     
    const userİnfo = {
      userName: userName,
      email: email,
      cinsiyet: cinsiyet,
      admin: admin,
      uid:userId
    }

    set(UserinfoRef, userİnfo)
  }

  // Hata kodlarını çeviren yardımcı fonksiyon
  const translateError = (errorCode) => {
    let turkceHata = "Bir hata oluştu. Lütfen tekrar deneyin.";
    
    if (errorCode === "auth/invalid-email") {
      turkceHata = "Geçersiz e-posta adresi.";
    } else if (errorCode === "auth/user-disabled") {
      turkceHata = "Bu kullanıcı hesabı devre dışı bırakılmıştır.";
    } else if (errorCode === "auth/user-not-found") {
      turkceHata = "Bu e-posta adresine ait bir kullanıcı bulunamadı.";
    } else if (errorCode === "auth/wrong-password") {
      turkceHata = "Hatalı şifre girdiniz.";
    } else if (errorCode === "auth/too-many-requests") {
      turkceHata = "Çok fazla hatalı giriş denemesi yaptınız. Lütfen daha sonra tekrar deneyin.";
    } else if (errorCode === "auth/email-already-in-use") {
      turkceHata = "Bu e-posta adresi zaten kullanımda.";
    } else if (errorCode === "auth/weak-password") {
      turkceHata = "Şifre çok zayıf. En az 6 karakter kullanın.";
    }
    
    return turkceHata;
  };

  // Yeni giriş yapma işlevi - form submit handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(''); // Her denemede hata mesajını temizle
    
    if (showUserandCinsiyet) {
      // Kayıt olma işlemi
      await handleSubmit(e);
    } else {
      // Giriş yapma işlemi
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Giriş başarılı:", user);
        
        // Başarılı giriş sonrası yönlendirme
        navigate('/', { state: { userId: user.uid } });
        
      } catch (error) {
        const errorCode = error.code;
        console.error("Giriş hatası:", errorCode, error.message);
        setErrorMessage(translateError(errorCode));
      }
    }
  };

  return (
    <div className="signup-container"> {/* Ana div için bir class */}
      <form onSubmit={handleFormSubmit} className="signup-form"> {/* Form için bir class */}
        <h2>{showUserandCinsiyet ? 'Kayıt Ol' : 'Giriş Yap'}</h2> {/* Başlık için class */}
       {showUserandCinsiyet && <input
          type="text"
          placeholder="Kullanıcıadı"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="signup-input" // Kullanıcı adı input'u için class
        />}
       {showUserandCinsiyet && <select name="cinsiyet" id="" value={cinsiyet} onChange={(e)=>{setCinsiyet(e.target.value)}} className="signup-select"> {/* Select için class */}
          <option value="" disabled selected>Cinsiyet Seçin</option>
          <option value="Erkek">Erkek</option>
          <option value="Kadın">Kadın</option>
          <option value="Diğer">Diğer</option>
        </select>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="signup-input" // Email input'u için class
        />
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="signup-input" // Şifre input'u için class
        />
        
        {/* Hata mesajını göster */}
        {errorMessage && <p className="error-message" style={{ color: 'red' }}>{errorMessage}</p>}
        
        <button type="submit" className="signup-button">
          {showUserandCinsiyet ? 'Kayıt ol' : 'Giriş yap'}
        </button>
        
        <p className='giriskayit' onClick={girsyap}>
          {showUserandCinsiyet 
            ? 'Zaten hesabınız var mı? Giriş yapın' 
            : 'Hesabınız yok mu? Kayıt olun'}
        </p>
        <button type="button" onClick={handleGoogleSignIn} className="google-button"><FcGoogle /></button>
        <button type="button" onClick={()=>{navigate('/create-team')}} className='team-button'>Kulüp oluştur</button>
         {/* Google butonu için class */}
      </form>
    </div>
  );
}

export default Singup;