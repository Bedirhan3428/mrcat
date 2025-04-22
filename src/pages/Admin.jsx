import React, { useEffect, useState } from 'react';
import { ref, get, update, remove } from 'firebase/database';
import { database } from '../FirebaseConfig';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import '../css/admin.css';

function Admin() {
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userUid, setUserUid] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [bakiyeModalAcik, setBakiyeModalAcik] = useState(false);
  const [secilenCalisanId, setSecilenCalisanId] = useState(null);
  const [yeniBakiye, setYeniBakiye] = useState(0);

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserUid(user.uid);
        checkIfAdmin(user.uid);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const fetchEmployees = async (shopId) => {
    try {
      const employeesRef = ref(database, `worksName/${shopId}/employees`);
      const snapshot = await get(employeesRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(id => ({ id, ...data[id], bakiye: data[id].bakiye || 0 }));
        setEmployees(list);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error("Çalışanlar alınırken hata:", error);
    }
  };

  const checkIfAdmin = async (uid) => {
    try {
      const dbRef = ref(database, 'worksName');
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const userShops = Object.entries(data)
          .filter(([_, shop]) => shop.admin?.uid === uid)
          .map(([id, shop]) => ({ id, name: shop.admin.workName }));
        if (userShops.length) {
          setIsAdmin(true);
          setShops(userShops);
          setSelectedShop(userShops[0]);
          fetchRequests(userShops[0].id);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Admin kontrolü sırasında hata:", error);
      setLoading(false);
    }
  };

  const fetchRequests = async (shopId) => {
    setLoading(true);
    try {
      const refReq = ref(database, `worksName/${shopId}/requests`);
      const snapshot = await get(refReq);
      if (snapshot.exists()) {
        const list = Object.entries(snapshot.val()).map(([id, val]) => ({ id, ...val }));
        list.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));
        setRequests(list);
      } else {
        setRequests([]);
      }
      await fetchEmployees(shopId);
    } catch (err) {
      console.error("İstekleri getirme hatası:", err);
    }
    setLoading(false);
  };

  const acceptRequest = async (request) => {
    try {
      await update(ref(database, `worksName/${selectedShop.id}/requests/${request.id}`), { status: 'accepted' });
      await update(ref(database, `worksName/${selectedShop.id}/employees/${request.userId}`), {
        name: request.userName,
        email: request.email,
        role: 'employee',
        joinDate: new Date().toISOString(),
      });
      fetchRequests(selectedShop.id);
    } catch (err) {
      console.error("İstek kabul edilirken hata:", err);
    }
  };

  const rejectRequest = async (request) => {
    try {
      await update(ref(database, `worksName/${selectedShop.id}/requests/${request.id}`), { status: 'rejected' });
      fetchRequests(selectedShop.id);
    } catch (err) {
      console.error("İstek reddedilirken hata:", err);
    }
  };

  const deleteRequest = async (request) => {
    try {
      await remove(ref(database, `worksName/${selectedShop.id}/requests/${request.id}`));
      fetchRequests(selectedShop.id);
    } catch (err) {
      console.error("İstek silinirken hata:", err);
    }
  };

  const handleShopChange = (shop) => {
    setSelectedShop(shop);
    fetchRequests(shop.id);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return { color: 'orange', text: 'Beklemede' };
      case 'accepted': return { color: 'green', text: 'Kabul Edildi' };
      case 'rejected': return { color: 'red', text: 'Reddedildi' };
      default: return { color: 'gray', text: 'Bilinmiyor' };
    }
  };

  const handleBakiyeDegistirTikla = (calisanId) => {
    setSecilenCalisanId(calisanId);
    setBakiyeModalAcik(true);
    const calisan = employees.find(e => e.id === calisanId);
    setYeniBakiye(calisan?.bakiye || 0);
  };

  const guncelleCalisanBakiye = async (calisanId, miktar, islem) => {
    const calisanRef = ref(database, `worksName/${selectedShop.id}/employees/${calisanId}`);
    const snapshot = await get(calisanRef);
    if (!snapshot.exists()) return;
    const mevcut = snapshot.val().bakiye || 0;
    const yeni = islem === 'ekle' ? mevcut + miktar : Math.max(mevcut - miktar, 0);
    await update(calisanRef, { bakiye: yeni });
    setBakiyeModalAcik(false);
    setYeniBakiye('')
    fetchEmployees(selectedShop.id);
  };

  if (loading) return <div className="admin-loading">Yükleniyor...</div>;
  if (!isAdmin) return <div className="admin-error">Bu sayfaya erişim izniniz yok.</div>;

  return (
    <div className="admin-container">
      <h1>Admin Paneli</h1>

      {shops.length > 0 && (
        <>
          <div className="shop-selector">
            <label>Dükkan Seçin:</label>
            <select value={selectedShop?.id || ''} onChange={(e) => handleShopChange(shops.find(s => s.id === e.target.value))}>
              {shops.map(shop => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
            </select>
          </div>

          <div className="selected-shop">
            <h2>{selectedShop.name} - Katılma İstekleri</h2>
            {requests.length > 0 ? (
              <table>
                <thead>
                  <tr><th>Kullanıcı</th><th>E-posta</th><th>Tarih</th><th>Durum</th><th>İşlemler</th></tr>
                </thead>
                <tbody>
                  {requests.map(req => {
                    const status = getStatusStyle(req.status);
                    return (
                      <tr key={req.id}>
                        <td>{req.userName}</td>
                        <td>{req.email}</td>
                        <td>{formatDate(req.requestDate)}</td>
                        <td style={{ color: status.color }}>{status.text}</td>
                        <td>
                          {req.status === 'pending' && (
                            <>
                              <button onClick={() => acceptRequest(req)}>Kabul Et</button>
                              <button onClick={() => rejectRequest(req)}>Reddet</button>
                            </>
                          )}
                          <button onClick={() => deleteRequest(req)}>Sil</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : <p>Henüz istek yok.</p>}
          </div>

          <div className="employees-list">
            <h3>{selectedShop.name} - Çalışanlar</h3>
            {employees.length > 0 ? (
              <table>
                <thead>
                  <tr><th>İsim</th><th>E-posta</th><th>Bakiye</th><th>İşlemler</th></tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id}>
                      <td>{emp.name}</td>
                      <td>{emp.email}</td>
                      <td>{emp.bakiye}</td>
                      <td><button onClick={() => handleBakiyeDegistirTikla(emp.id)}>Bakiye Değiştir</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p>Henüz çalışan yok.</p>}
          </div>
        </>
      )}

      {bakiyeModalAcik && (
        <div className="bakiye-modal">
          <h3>Bakiye Değiştir</h3>
          <input type="number" value={yeniBakiye} onChange={(e) => setYeniBakiye(parseFloat(e.target.value))} />
          <button onClick={() => guncelleCalisanBakiye(secilenCalisanId, yeniBakiye, 'ekle')}>Ekle</button>
          <button onClick={() => guncelleCalisanBakiye(secilenCalisanId, yeniBakiye, 'azalt')}>Azalt</button>
          <button onClick={() => setBakiyeModalAcik(false)}>Kapat</button>
        </div>
      )}
    </div>
  );
}

export default Admin;
