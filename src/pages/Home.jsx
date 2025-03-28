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


    const navigates = () => {
        navigate('/singup');
    };

    useEffect(() => {
        if (uid === 'BYDmxuHRDPOJFbLk2MnxxUeqggj2') {
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
                // Toplam bakiyeyi hesapla
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
        const db = getDatabase();
        kullanicilar.forEach(kullanici => {
            if (kullanici.uid !== 'BYDmxuHRDPOJFbLk2MnxxUeqggj2') {
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
                        <button className='delete' onClick={sifirlaTumBakiyeler}>Tümünü Sıfırla</button>
                    </div>
                    {filtrelenmisKullanicilar.map((kullanici) => {
                        if (kullanici.uid !== 'lHo8dShDB8Tt3ZiUd8vsEUT1uC33') {
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
