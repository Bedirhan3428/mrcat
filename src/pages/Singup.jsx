import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from '../FirebaseConfig';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    sendEmailVerification 
} from "firebase/auth";
import { getDatabase, ref, set, get } from "firebase/database";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../css/sginup.css';

const SignupLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userName, setUserName] = useState('');
    const [cinsiyet, setCinsiyet] = useState('');
    const [isSignup, setIsSignup] = useState(true);
    const [userID, setUserID] = useState('');
    const [gmailGirisYapildi, setGmailGirisYapildi] = useState(false);
    const [kullaniciAdiAlindi, setKullaniciAdiAlindi] = useState(false);
    const [hataMesaji, setHataMesaji] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const db = getDatabase();
    const navigate = useNavigate();

    useEffect(() => {
        const mevcutKullanici = auth.currentUser;
        if (mevcutKullanici) {
            setUserID(mevcutKullanici.uid);
            kontrolKullaniciAdi(mevcutKullanici.uid);
        }
    }, []);

    const kontrolKullaniciAdi = async (uid) => {
        try {
            const kullaniciRef = ref(db, `kullanicilar/${uid}/userName`);
            const snapshot = await get(kullaniciRef);
            if (snapshot.exists()) {
                setKullaniciAdiAlindi(true);
                navigate('/home', { state: { uid: uid } });
            }
        } catch (error) {
            toast.error('Kullanıcı adı kontrol hatası');
            console.error('Kullanıcı adı kontrol hatası:', error);
        }
    };

    const handleGmailGiris = async () => {
        setIsLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            setUserID(user.uid);
            setGmailGirisYapildi(true);
            await kontrolKullaniciAdi(user.uid);
            toast.success('Giriş başarılı!');
        } catch (error) {
            toast.error('Gmail ile giriş hatası');
            console.error('Gmail ile giriş hatası:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKullaniciAdiKaydet = async () => {
        const validationError = kullaniciAdiKontrolu(userName);
        if (validationError) {
            setHataMesaji(validationError);
            return;
        }

        if (!cinsiyet) {
            setHataMesaji('Cinsiyet zorunludur.');
            return;
        }

        setIsLoading(true);
        try {
            const kullaniciRef = ref(db, `kullanicilar/${userID}`);
            await set(kullaniciRef, {
                userName: userName,
                cinsiyet: cinsiyet,
                bakiye: 0,
                email: auth.currentUser.email,
            });
            setKullaniciAdiAlindi(true);
            navigate('/home', { state: { uid: userID } });
            toast.success('Kullanıcı verileri kaydedildi.');
        } catch (error) {
            toast.error('Kullanıcı adı kaydetme hatası');
            console.error('Kullanıcı adı kaydetme hatası:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const kullaniciAdiKontrolu = (userName) => {
        if (!userName || userName.length < 3) {
            return 'Kullanıcı adı 3 harften kısa olamaz.';
        }
        if (userName.includes('@') || /[!@#$%^&*(),.?":{}|<>]/g.test(userName)) {
            return 'Kullanıcı adı özel karakter içeremez.';
        }
        return null; // Kullanıcı adı geçerli
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setHataMesaji('');
        setIsLoading(true);

        // Validate inputs
        if (isSignup) {
            const validationError = kullaniciAdiKontrolu(userName);
            if (validationError) {
                setHataMesaji(validationError);
                setIsLoading(false);
                return;
            }

            if (!cinsiyet) {
                setHataMesaji('Cinsiyet zorunludur.');
                setIsLoading(false);
                return;
            }
        }

        // Password validation
        if (password.length < 6) {
            setHataMesaji('Şifre en az 6 karakter olmalıdır.');
            setIsLoading(false);
            return;
        }

        try {
            if (isSignup) {
                // Kayıt işlemi
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                const kullaniciRef = ref(db, `kullanicilar/${user.uid}`);
                await set(kullaniciRef, {
                    userName: userName,
                    cinsiyet: cinsiyet,
                    bakiye: 0,
                    email: email,
                });

                await sendEmailVerification(user);
                toast.success('Kayıt başarılı! Lütfen e-postanızı doğruladıktan sonra giriş yapın.');


            } 
            
            
            
            else {
                // Giriş işlemi
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                if (user.emailVerified) {
                    setUserID(user.uid);
                    navigate('/home', { state: { uid: user.uid } });
                    toast.success('Giriş başarılı!');
                } else {
                    setHataMesaji('Lütfen e-posta adresinizi doğrulayın.');
                }
            }
        } catch (error) {
            let errorMessage = 'Bir hata oluştu. Lütfen tekrar deneyin.';

            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Bu e-posta zaten kullanımda.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Geçersiz e-posta adresi.';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'Kullanıcı bulunamadı. Kayıt olun.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Yanlış şifre. Tekrar deneyin.';
                    break;
            }

            setHataMesaji(errorMessage);
            console.error(isSignup ? 'Kayıt hatası:' : 'Giriş hatası:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='form-container'>
            <div className='form'>
                <h2>{isSignup ? 'Kayıt Ol' : 'Giriş Yap'}</h2>
                {hataMesaji && <p className='error-message'>{hataMesaji}</p>}
                
                <form onSubmit={handleSubmit}>
                    {isSignup && !gmailGirisYapildi && (
                        <>
                            <input 
                                className='username' 
                                type="text" 
                                placeholder="Kullanıcı adı" 
                                value={userName} 
                                onChange={(e) => setUserName(e.target.value)} 
                                required 
                            />
                            <div className='gender-select'>
                                <label>Cinsiyet: </label>
                                <select 
                                    className='cins' 
                                    value={cinsiyet} 
                                    onChange={(e) => setCinsiyet(e.target.value)}
                                    required
                                >
                                    <option value="">Seçiniz</option>
                                    <option value="erkek">Erkek</option>
                                    <option value="kadin">Kadın</option>
                                    <option value="diger">Diğer</option>
                                </select>
                            </div>
                        </>
                    )}

                    {!gmailGirisYapildi && (
                        <>
                            <input 
                                type="email" 
                                className='email' 
                                placeholder="E-posta" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                            />
                            <input 
                                type="password" 
                                className='password' 
                                placeholder="Şifre" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                            />
                            <button 
                                className='kayit' 
                                type="submit" 
                                disabled={isLoading}
                            >
                                {isLoading ? 'İşlem Yapılıyor...' : (isSignup ? 'Kayıt Ol' : 'Giriş Yap')}
                            </button>
                        </>
                    )}
                </form>

                <p 
                    className='toggle-signup' 
                    onClick={() => {
                        setIsSignup(!isSignup);
                        setGmailGirisYapildi(false);
                        setHataMesaji('');
                    }}
                >
                    {isSignup 
                        ? 'Zaten hesabınız var mı? Giriş yapın' 
                        : 'Hesabınız yok mu? Kayıt olun'}
                </p>

                <div className='gmail-login'>
                    <h2>Gmail ile Giriş Yap</h2>
                    {!gmailGirisYapildi ? (
                        <button 
                            onClick={handleGmailGiris} 
                            disabled={isLoading}
                        >
                            {isLoading ? 'İşlem Yapılıyor...' : 'Gmail ile Giriş Yap'}
                        </button>
                    ) : !kullaniciAdiAlindi ? (
                        <div>
                            <input 
                                type="text" 
                                className='gmailusername'
                                placeholder="Kullanıcı adı" 
                                value={userName} 
                                onChange={(e) => setUserName(e.target.value)} 
                            />
                            <div className='gender-select'>
                                <label>Cinsiyet: </label>
                                <select 
                                    value={cinsiyet} 
                                    onChange={(e) => setCinsiyet(e.target.value)}
                                >
                                    <option value="">Seçiniz</option>
                                    <option value="erkek">Erkek</option>
                                    <option value="kadin">Kadın</option>
                                    <option value="diger">Diğer</option>
                                </select>
                            </div>
                            <button 
                                onClick={handleKullaniciAdiKaydet} 
                                disabled={isLoading}
                            >
                                {isLoading ? 'Kaydediliyor...' : 'Kullanıcı Adını Kaydet'}
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default SignupLogin;
