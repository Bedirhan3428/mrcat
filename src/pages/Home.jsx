import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getDatabase, ref, get, onValue, update } from "firebase/database";
import { auth, signOut } from '../FirebaseConfig';
import '../css/home.css';
import '../css/admin.css';

function Home() {
    const navigate = useNavigate();
    const location = useLocation();
    const uid = location.state?.uid;

    const [cevir, setCevir] = useState(true);
    const [cevir1, setCevir1] = useState(false);
    const [uN, setUN] = useState('');
    const [tutar, setTutar] = useState(0);
    const [kullanicilar, setKullanicilar] = useState([]);
    const [ekBilgiler, setEkBilgiler] = useState({});
    const [admin, setAdmin] = useState(false);
    const [user, setUser] = useState(true);
    const [cinsiyetFiltresi, setCinsiyetFiltresi] = useState(null);
    const [aramaKelimesi, setAramaKelimesi] = useState('');
    const [toplamBakiye, setToplamBakiye] = useState(0); // Toplam bakiye için state
    const [yeniAdBilgileri, setYeniAdBilgileri] = useState({});
    const [showConfirm, setShowConfirm] = useState(false);
    const [result, setResult] = useState(null);

    const navigates = () => {
        navigate('/singup');
    };

    const errorsifir = ()=>{
        console.log('İptal Edildi')
        setShowConfirm(false)
    }
    
     






    useEffect(() => {
        if (uid === 'pOX1Lx7ocKfY3WvvQO2Z8iCCIR32') {
            setAdmin(true);
            setUser(false);
        }
    }, [uid]);

    useEffect(() => {
        if (uid) {
            veriCek();
            setCevir(false);
            setCevir1(true);
            veriCekKullanicilar();
        }
    }, [uid]);

    const veriCekKullanicilar = () => {
        const db = getDatabase();
        const kullanicilarRef = ref(db, "kullanicilar");

        onValue(kullanicilarRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const kullaniciListesi = Object.keys(data).map((uid) => ({
                    uid: uid,
                    ...data[uid],
                }));
                setKullanicilar(kullaniciListesi);
                const toplam = kullaniciListesi.reduce((acc, kullanici) => acc + (kullanici.bakiye || 0), 0);
                setToplamBakiye(toplam);
            } else {
                setKullanicilar([]);
                setToplamBakiye(0);
            }
        });
    };

    const handleInputChange = (uid, value) => {
        setEkBilgiler({ ...ekBilgiler, [uid]: value });
    };

    const handleYeniAdInputChange = (uid, value) => {
        setYeniAdBilgileri({ ...yeniAdBilgileri, [uid]: value });
    };

    const kullaniciAdiGuncelle = (guncellenecekUid) => {
        const db = getDatabase();
        const yeniAd = yeniAdBilgileri[guncellenecekUid];

        if (!yeniAd || yeniAd.trim() === '') {
            alert("Lütfen geçerli bir kullanıcı adı girin.");
            return;
        }

        const kullaniciRef = ref(db, `kullanicilar/${guncellenecekUid}`);

        update(kullaniciRef, {
            userName: yeniAd,
        })
            .then(() => {
                console.log("Kullanıcı adı başarıyla güncellendi.");
                veriCekKullanicilar();
                // Clear the input after successful update
                setYeniAdBilgileri({ ...yeniAdBilgileri, [guncellenecekUid]: '' });
            })
            .catch((error) => {
                console.error("Kullanıcı adı güncelleme hatası:", error);
            });
    };

    const cikisYap = async () => {
        try {
            await signOut(auth);
            setCevir(true);
            setCevir1(false);
            navigate('/singup');
        } catch (error) {
            console.error("Çıkış hatası:", error);
        }
    };


    const veriCek = () => {
        const db = getDatabase();
        const kullaniciRef = ref(db, `kullanicilar/${uid}`);

        get(kullaniciRef).then((snapshot) => {
            if (snapshot.exists()) {
                const kullaniciVerileri = snapshot.val();
                setUN(kullaniciVerileri.userName);
                setTutar(kullaniciVerileri.bakiye);
            } else {
                console.log("Veri bulunamadı");
            }
        }).catch((error) => {
            console.error("Veri çekme hatası:", error);
        });
    };

    const bakiyeGuncelle = (guncellenecekUid, mevcutBakiye, azalt = false) => {
        const db = getDatabase();
        const kullaniciRef = ref(db, `kullanicilar/${guncellenecekUid}`);
        let eklenecekBakiye = parseInt(ekBilgiler[guncellenecekUid]);

        if (isNaN(eklenecekBakiye)) {
            alert("Lütfen geçerli bir sayı girin.");
            return;
        }

        if (azalt) {
            eklenecekBakiye = -eklenecekBakiye;
        }

        let yeniBakiye = mevcutBakiye + eklenecekBakiye;

        if (yeniBakiye < 0) {
            yeniBakiye = 0;
        }

        update(kullaniciRef, {
            bakiye: yeniBakiye,
        })
            .then(() => {
                console.log("Bakiye başarıyla güncellendi.");
                veriCekKullanicilar();
                veriCek();
                setEkBilgiler({ ...ekBilgiler, [guncellenecekUid]: '' });
            })
            .catch((error) => {
                console.error("Bakiye güncelleme hatası:", error);
            });
    };








    const sifirlaTumBakiyeler = () => {
        setShowConfirm(false)

        
        const db = getDatabase();
        kullanicilar.forEach(kullanici => {
<<<<<<< HEAD
            if (kullanici.uid !== 'Cit2efgEJmRceeZEFl3hSr60W963') {
=======
            if (kullanici.uid !== 'pOX1Lx7ocKfY3WvvQO2Z8iCCIR32') {
>>>>>>> 769d45c083e471fb24082ff16704650f8be5a00a
                const kullaniciRef = ref(db, `kullanicilar/${kullanici.uid}`);
                update(kullaniciRef, { bakiye: 0 })
                    .then(() => console.log(`${kullanici.userName} bakiyesi sıfırlandı.`))
                    .catch(error => console.error(`${kullanici.userName} bakiye sıfırlama hatası:`, error));
            }
        });
        veriCekKullanicilar(); // Kullanıcı listesini güncelle
        veriCek(); // Kullanıcının kendi bakiyesini güncelle
    };

    const filtreleCinsiyet = (cinsiyet) => {
        setCinsiyetFiltresi(cinsiyet);
    };

    const handleArama = (e) => {
        setAramaKelimesi(e.target.value);
    };

    const filtrelenmisKullanicilar = cinsiyetFiltresi
        ? kullanicilar.filter((kullanici) => kullanici.cinsiyet === cinsiyetFiltresi && kullanici.userName.toLowerCase().startsWith(aramaKelimesi.toLowerCase()))
        : kullanicilar.filter((kullanici) => kullanici.userName.toLowerCase().startsWith(aramaKelimesi.toLowerCase()));

    return (
        <div>
            {showConfirm && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '20px', border: '1px solid #ccc' }}>
          <p>Are you sure?</p>
          <button onClick={sifirlaTumBakiyeler}>OK</button>
          <button onClick={errorsifir}>Cancel</button>
        </div>
      )}
      {result && <p>{result}</p>}
            {user && (
                <div>
                    <header className='header'>
                        <h1 className='logo'>Mr.Ket</h1>
                        {cevir1 && <p>Merhaba ! {uN}</p>}
                        {cevir && <button className='Giriş' onClick={navigates}>Girş/Kaydol</button>}
                        {cevir1 && <button className='Giriş' onClick={cikisYap}>Çıkış yap</button>}
                    </header>
                    <div>
                      {cevir1 &&  <h1>Ödenecek Tutar : {tutar}</h1>}
                    </div>
                </div>
            )}

            {admin && (
                <div>
                    <header className='header'>
                        <h1 className='logo'>Mr.Ket - Admin Paneli</h1>
                        <button className='Giriş' onClick={cikisYap}>Çıkış yap</button>
                    </header>
                    <div className='buttonlar'>
                        <input
                            className='searchUser'
                            type="text"
                            placeholder="Kullanıcı Ara"
                            value={aramaKelimesi}
                            onChange={handleArama}
                        />
                        <button className='erkek' onClick={() => filtreleCinsiyet('erkek')}>Erkekler</button>
                        <button className='kadin' onClick={() => filtreleCinsiyet('kadin')}>Kadınlar</button>
                        <button className='tumu' onClick={() => setCinsiyetFiltresi(null)}>Tümü</button>
                        <button className='delete' onClick={()=>{setShowConfirm(true)}}>Tümünü Sıfırla</button>
                    </div>
                    {filtrelenmisKullanicilar.map((kullanici) => {
                        if (kullanici.uid !== 'Cit2efgEJmRceeZEFl3hSr60W963') {
                            return (
                                <div className='userinf' key={kullanici.uid}>
                                    <p className='name'>Ad: {kullanici.userName}</p>
                                    <p className='bakiye'>Bakiye: {kullanici.bakiye}</p>
                                    <input
                                        className='bakiyedegis'
                                        type="number"
                                        placeholder="Bakiye Değiştir"
                                        value={ekBilgiler[kullanici.uid] || ""}
                                        onChange={(e) => handleInputChange(kullanici.uid, e.target.value)}
                                    />
                                    <button className='ekle' onClick={() => bakiyeGuncelle(kullanici.uid, kullanici.bakiye)}>Ekle</button>
                                    <button className='azalt' onClick={() => bakiyeGuncelle(kullanici.uid, kullanici.bakiye, true)}>Azalt</button>

                                    <input
                                        className='bakiyedegis'
                                        type="text"
                                        placeholder="Yeni Kullanıcı Adı"
                                        value={yeniAdBilgileri[kullanici.uid] || ""}
                                        onChange={(e) => handleYeniAdInputChange(kullanici.uid, e.target.value)}
                                    />
                                    <button className='tumu' onClick={() => kullaniciAdiGuncelle(kullanici.uid)}>Adı Güncelle</button>
                                </div>
                            );
                        }
                        return null;
                    })}
                    <div>
                        <h2>Toplam Bakiye: {toplamBakiye}</h2>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;
