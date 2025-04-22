import React, { use } from 'react';
import '../css/admin.css';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../FirebaseConfig';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, set, push } from 'firebase/database';

function CreateTeam() {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [userName, setUserName] = React.useState('');
    const [workName, setWorkName] = React.useState('');
    const [age, setAge] = React.useState('');
    const [phone, setPhone] = React.useState('');
    const [userUid, setUserUid] = React.useState('SD<FSDFSDF<SDF'); // Kullanıcının UID'si

    const database = getDatabase();
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('Kullanıcı UID:', user.uid);
            setUserUid(user.uid); // Kullanıcının UID'sini alıyoruz
            await veriYaz(user.uid); // Kullanıcının UID'sini veriYaz fonksiyonuna gönderiyoruz
            navigate('/admin');
        } catch (error) {
            console.error('Kayıt hatası:', error.code, error.message);
        }
    };

    const veriYaz = async (uid) => {
        const adminRef = ref(database, 'worksName/' + uid + '/admin'); // worksName altında kullanıcı UID'si ile yeni bir referans oluşturuyoruz
        const kullanicilarRef = ref(database, 'worksName/' + uid + '/kullanicilar');
        const isteklerRef = ref(database, 'worksName/' + uid + '/istekler');




        const adminİnfo = {
            userName: userName,
            workName: workName,
            age: age,
            phone: phone,
            email: email,
            uid: uid,
        };

        const yeniKayitRef = set(adminRef, adminİnfo);
        const kullaniciKayitRef = set(kullanicilarRef, {mesaj:''}); // Kullanıcı bilgilerini worksName altında kaydediyoruz
       
        
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="form">
                <input type="text" placeholder="Ad Soyad" value={userName} className="metin-alani" onChange={(e) => setUserName(e.target.value)} />
                <br /><br />
                <input type="number" placeholder="Yaş" value={age} className="sayi-alani" onChange={(e) => setAge(e.target.value)} />
                <br /><br />
                <input type="text" placeholder="İşletme adı" value={workName} className="diger-metin-alani" onChange={(e) => setWorkName(e.target.value)} />
                <br /><br />
                <input type="tel" placeholder="Telefon" value={phone} className="sayi-alani" onChange={(e) => setPhone(e.target.value)} />
                <br /><br />
                <input type="email" placeholder="Email" value={email} className="eposta-alani" onChange={(e) => setEmail(e.target.value)} />
                <br /><br />
                <input type="password" placeholder="Şifre" value={password} className="parola-alani" onChange={(e) => setPassword(e.target.value)} />
                <br /><br />
                <button type="submit" className="onay-butonu">Devam et</button>
            </form>
        </div>
    );
}

export default CreateTeam;
