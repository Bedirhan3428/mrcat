import React, { useEffect, useState } from 'react';
import { ref, get, update, remove } from 'firebase/database';
import { database } from '../FirebaseConfig';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import '../css/admin.css'; // CSS dosyasını import edebilirsiniz

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


  // Kullanıcı kontrolü
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
        const employeesData = snapshot.val();
        const employeeList = Object.keys(employeesData).map(empId => ({
          id: empId,
          ...employeesData[empId],
          bakiye: employeesData[empId].bakiye || 0 // Eğer bakiye yoksa 0 ata
        }));
        setEmployees(employeeList);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error("Çalışanlar alınırken hata:", error);
    }
  };

  const handleBakiyeDegistirTikla = (calisanId) => {
    setSecilenCalisanId(calisanId);
    setBakiyeModalAcik(true);
    setYeniBakiye(employees.find(emp => emp.id === calisanId)?.bakiye || 0); // Mevcut bakiyeyi modal inputuna yaz
  };
  // Kullanıcının admin olup olmadığını kontrol et
  const checkIfAdmin = async (uid) => {
    try {
      const dbRef = ref(database, 'worksName');
      const snapshot = await get(dbRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const userShops = [];
        
        // Kullanıcının admin olduğu dükkanları bul
        Object.keys(data).forEach(shopId => {
          const shop = data[shopId];
          if (shop.admin && shop.admin.uid === uid) {
            userShops.push({
              id: shopId,
              name: shop.admin.workName
            });
          }
        });
        
        if (userShops.length > 0) {
          setIsAdmin(true);
          setShops(userShops);
          // İlk dükkanı seç
          if (userShops.length > 0) {
            setSelectedShop(userShops[0]);
            fetchRequests(userShops[0].id);
          }
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Admin kontrolü sırasında hata:", error);
      setLoading(false);
    }
  };

  // Seçilen dükkanın isteklerini getir
  const fetchRequests = async (shopId) => {
    setLoading(true);
    try {
      const requestsRef = ref(database, `worksName/${shopId}/requests`);
      const snapshot = await get(requestsRef);
      
      if (snapshot.exists()) {
        const requestsData = snapshot.val();
        const requestsList = [];
        
        Object.keys(requestsData).forEach(requestId => {
          requestsList.push({
            id: requestId,
            ...requestsData[requestId]
          });
        });
        
        requestsList.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));
        setRequests(requestsList);
      } else {
        setRequests([]);
      }
  
      await fetchEmployees(shopId); // 🔥 burası eklendi
    } catch (error) {
      console.error("İstekleri getirme hatası:", error);
    }
    setLoading(false);
  };
  

  // İsteği kabul et
  const acceptRequest = async (request) => {
    try {
      // İsteği güncelle
      const requestRef = ref(database, `worksName/${selectedShop.id}/requests/${request.id}`);
      await update(requestRef, { status: 'accepted' });
      
      // Ayrıca kullanıcıyı çalışanlar listesine ekleyebilirsiniz
      const employeeRef = ref(database, `worksName/${selectedShop.id}/employees/${request.userId}`);
      await update(employeeRef, {
        name: request.userName,
        email: request.email,
        role: 'employee',
        joinDate: new Date().toISOString()
      });
      
      // İstekleri yeniden yükle
      fetchRequests(selectedShop.id);
    } catch (error) {
      console.error("İstek kabul edilirken hata:", error);
      alert("İstek kabul edilirken bir hata oluştu!");
    }
  };

  // İsteği reddet
  const rejectRequest = async (request) => {
    try {
      // İsteği güncelle
      const requestRef = ref(database, `worksName/${selectedShop.id}/requests/${request.id}`);
      await update(requestRef, { status: 'rejected' });
      
      // İstekleri yeniden yükle
      fetchRequests(selectedShop.id);
    } catch (error) {
      console.error("İstek reddedilirken hata:", error);
      alert("İstek reddedilirken bir hata oluştu!");
    }
  };

  // İsteği sil
  const deleteRequest = async (request) => {
    try {
      const requestRef = ref(database, `worksName/${selectedShop.id}/requests/${request.id}`);
      await remove(requestRef);
      
      // İstekleri yeniden yükle
      fetchRequests(selectedShop.id);
    } catch (error) {
      console.error("İstek silinirken hata:", error);
      alert("İstek silinirken bir hata oluştu!");
    }
  };

  // Tarih formatını düzenle
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Duruma göre renk ve metin
  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending':
        return { color: 'orange', text: 'Beklemede' };
      case 'accepted':
        return { color: 'green', text: 'Kabul Edildi' };
      case 'rejected':
        return { color: 'red', text: 'Reddedildi' };
      default:
        return { color: 'gray', text: 'Bilinmiyor' };
    }
  };

  if (loading) {
    return <div className="admin-loading">Yükleniyor...</div>;
  }

  if (!isAdmin) {
    return <div className="admin-error">Bu sayfaya erişim izniniz yok.</div>;
  }
  // Dükkan seçimi değiştiğinde istekleri güncelle
const handleShopChange = (shop) => {
  setSelectedShop(shop);
  fetchRequests(shop.id);
};


  return (
    <div className="admin-container">
      <h1>Admin Paneli</h1>
      
      {shops.length > 0 ? (
        <>
          <div className="shop-selector">
            <label>Dükkan Seçin:</label>
            <select 
              value={selectedShop ? selectedShop.id : ''} 
              onChange={(e) => {
                const selectedShopObj = shops.find(shop => shop.id === e.target.value);
                handleShopChange(selectedShopObj);
              }}
            >
              {shops.map(shop => (
                <option key={shop.id} value={shop.id}>{shop.name}</option>
              ))}
            </select>
          </div>

          {selectedShop && (
            <div className="selected-shop">
              <h2>{selectedShop.name} - Katılma İstekleri</h2>
              
              {requests.length > 0 ? (
                <div className="requests-list">
                  <table>
                    <thead>
                      <tr>
                        <th>Kullanıcı</th>
                        <th>E-posta</th>
                        <th>Tarih</th>
                        <th>Durum</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map(request => {
                        const statusStyle = getStatusStyle(request.status);
                        
                        return (
                          <tr key={request.id}>
                            <td>{request.userName}</td>
                            <td>{request.email}</td>
                            <td>{formatDate(request.requestDate)}</td>
                            <td style={{ color: statusStyle.color }}>{statusStyle.text}</td>
                            <td className="actions">
                              {request.status === 'pending' && (
                                <>
                                  <button 
                                    className="accept-btn" 
                                    onClick={() => acceptRequest(request)}
                                  >
                                    Kabul Et
                                  </button>
                                  <button 
                                    className="reject-btn" 
                                    onClick={() => rejectRequest(request)}
                                  >
                                    Reddet
                                  </button>
                                </>
                              )}
                              <button 
                                className="delete-btn" 
                                onClick={() => deleteRequest(request)}
                              >
                                Sil
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-requests">Henüz hiç istek yok.</p>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="no-shops">Yönetici olduğunuz bir dükkan bulunamadı.</p>
      )}


<div className="employees-list">
        <h3>{selectedShop?.name} - Çalışanlar</h3>
        {employees.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>İsim</th>
                <th>E-posta</th>
                <th>Bakiye</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.bakiye}</td>
                  <td>
                    <button onClick={() => handleBakiyeDegistirTikla(emp.id)}>Bakiye Değiştir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-employees">Henüz çalışan yok.</p>
        )}
      </div>

      {bakiyeModalAcik && (
        <div className="bakiye-modal"> {/* CSS ile stilendirilecek */}
          <h3>Bakiye Değiştir</h3>
          <input
            type="number"
            value={yeniBakiye}
            onChange={(e) => setYeniBakiye(parseFloat(e.target.value) || 0)}
          />
          <button onClick={() => guncelleCalisanBakiye(secilenCalisanId, yeniBakiye, 'ekle')}>Ekle</button>
          <button onClick={() => guncelleCalisanBakiye(secilenCalisanId, yeniBakiye, 'azalt')}>Azalt</button>
          <button onClick={() => setBakiyeModalAcik(false)}>Kapat</button>
        </div>
      )}
    </div>
  );
}

export default Admin;
