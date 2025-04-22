import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { get, ref, set, push, remove } from 'firebase/database';
import { auth, database } from '../FirebaseConfig';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import '../css/home.css';

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const kullanici = location.state;

  const [shops, setShops] = useState([]); // Dükkan isimlerini ve ID'lerini tutacak
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userUid, setUserUid] = useState('');
  const [logOut, setLogout] = useState(true);
  const [logİn, setLogİn] = useState(false);
  const [userRequests, setUserRequests] = useState({}); // Kullanıcının isteklerini tutacak
  const [userMemberships, setUserMemberships] = useState([]); // Kullanıcının üye olduğu işletmeler
  
  // Görünüm kontrolleri
  const [showShopList, setShowShopList] = useState(true);
  const [showRequests, setShowRequests] = useState(false);
  const [showMemberships, setShowMemberships] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setLogout(false); 
        setLogİn(true);
        setEmail(user.email);
        setUserName(user.displayName || user.email);
        setUserUid(user.uid);
        
        // Kullanıcı giriş yaptığında isteklerini ve üyeliklerini kontrol edelim
        fetchUserRequests(user.uid);
        fetchUserMemberships(user.uid);
      } else {
        console.log('Kullanıcı giriş yapmamış.');
      }
    });
  }, []);

  // Kullanıcının tüm isteklerini getiren fonksiyon
  const fetchUserRequests = async (uid) => {
    if (!uid) return;
    
    try {
      // Tüm işletmeleri getir
      const shopRef = ref(database, 'worksName');
      const shopSnapshot = await get(shopRef);
      
      if (shopSnapshot.exists()) {
        const shops = shopSnapshot.val();
        const userRequestsData = {};
        
        // Her işletmenin isteklerini kontrol et
        for (const shopId in shops) {
          if (shops[shopId].requests) {
            // Bu işletmedeki tüm istekleri kontrol et
            const requests = shops[shopId].requests;
            for (const requestId in requests) {
              // Eğer istek bu kullanıcıya aitse, kaydet
              if (requests[requestId].userId === uid) {
                userRequestsData[shopId] = {
                  requestId: requestId,
                  status: requests[requestId].status,
                  shopName: shops[shopId].admin.workName
                };
              }
            }
          }
        }
        
        setUserRequests(userRequestsData);
      }
    } catch (error) {
      console.error('Kullanıcı istekleri alınırken hata:', error);
    }
  };

  // Kullanıcının üye olduğu işletmeleri getiren fonksiyon
  const fetchUserMemberships = async (uid) => {
    if (!uid) return;
    
    try {
      // Tüm işletmeleri getir
      const shopRef = ref(database, 'worksName');
      const shopSnapshot = await get(shopRef);
      
      if (shopSnapshot.exists()) {
        const shops = shopSnapshot.val();
        const memberships = [];
        
        // Her işletmeyi kontrol et
        for (const shopId in shops) {
          const shop = shops[shopId];
          
          // İşletmede üyeler varsa
          if (shop.members) {
            // Bu kullanıcı üye mi kontrol et
            for (const memberId in shop.members) {
              if (shop.members[memberId].userId === uid) {
                memberships.push({
                  shopId: shopId,
                  shopName: shop.admin.workName,
                  memberId: memberId
                });
                break;
              }
            }
          }
        }
        
        setUserMemberships(memberships);
      }
    } catch (error) {
      console.error('Kullanıcı üyelikleri alınırken hata:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setLogout(true);
      setLogİn(false);
      navigate('/singup');
    } catch (error) {
      console.error('Çıkış yaparken hata:', error);
    }
  }

  // İşletmeden ayrılma fonksiyonu
  const handleLeaveShop = async (shopId, memberId) => {
    try {
      // Üyelik referansını oluştur
      const memberRef = ref(database, `worksName/${shopId}/members/${memberId}`);
      
      // Üyeliği sil
      await remove(memberRef);
      
      // Kullanıcının üyeliklerini güncelle
      setUserMemberships(prev => prev.filter(membership => 
        !(membership.shopId === shopId && membership.memberId === memberId)
      ));
      
      alert('İşletmeden başarıyla ayrıldınız.');
    } catch (error) {
      console.error('İşletmeden ayrılırken hata:', error);
      alert('İşletmeden ayrılırken bir hata oluştu.');
    }
  };

  useEffect(() => {
    const fetchShopNames = async () => {
      const dbRef = ref(database, 'worksName');
      try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const shopsList = [];
          
          // Her işletmenin adını ve ID'sini birlikte saklayalım
          Object.keys(data).forEach(id => {
            const shop = data[id];
            shopsList.push({
              id: id,
              name: shop.admin.workName
            });
          });
          
          // İsimlere göre sıralama
          shopsList.sort((a, b) => a.name.localeCompare(b.name));
          setShops(shopsList);
        } else {
          console.log('Veri bulunamadı!');
        }
      } catch (error) {
        console.error('Veri çekme hatası:', error);
      }
    };
  
    fetchShopNames();
  }, []);

  // Arama filtresi
  const filteredShops = shops.filter((shop) =>
    shop.name.toLowerCase().startsWith(searchQuery.toLowerCase())
  );

  // Görünüm değiştirme fonksiyonları
  const showShopsView = () => {
    setShowShopList(true);
    setShowRequests(false);
    setShowMemberships(false);
  };

  const showRequestsView = () => {
    setShowShopList(false);
    setShowRequests(true);
    setShowMemberships(false);
  };

  const showMembershipsView = () => {
    setShowShopList(false);
    setShowRequests(false);
    setShowMemberships(true);
  };

  const handleJoinRequest = async (shop) => {
    // Verileri kontrol et
    if (!email || !userName || !userUid) {
      alert('Lütfen kaydolun.');
      return;
    }

    // Kullanıcı daha önce bu işletmeye istek göndermiş mi kontrol et
    if (userRequests[shop.id]) {
      // İsteğin durumunu kontrol et, eğer reddedilmişse yeni istek göndermeye izin ver
      if (userRequests[shop.id].status !== 'rejected') {
        alert(`Bu işletmeye zaten bir katılma isteği gönderdiniz. İsteğinizin durumu: ${getStatusText(userRequests[shop.id].status)}`);
        return;
      }
      // Reddedilmiş isteği sileceğiz ve yeni istek göndereceğiz
    }

    try {
      // İsteği veritabanına ekleyelim
      const requestData = {
        userId: userUid,
        userName: userName,
        email: email,
        status: 'pending', // istek durumu (beklemede, kabul edildi, reddedildi)
        requestDate: new Date().toISOString()
      };

      // İstekler için referans oluştur
      // worksName/[dükkan_id]/requests altına istek ekleyelim
      const requestsRef = ref(database, `worksName/${shop.id}/requests`);
      
      // Eğer reddedilmiş bir istek varsa, o isteği silelim
      if (userRequests[shop.id] && userRequests[shop.id].status === 'rejected') {
        const oldRequestId = userRequests[shop.id].requestId;
        const oldRequestRef = ref(database, `worksName/${shop.id}/requests/${oldRequestId}`);
        await set(oldRequestRef, null); // Eski isteği sil
      }
      
      // push() ile benzersiz bir ID ile yeni istek oluştur
      const newRequestRef = push(requestsRef);
      await set(newRequestRef, requestData);
      
      // İsteği kullanıcının kendi isteklerine de ekleyelim
      const newRequest = {
        [shop.id]: {
          requestId: newRequestRef.key,
          status: 'pending',
          shopName: shop.name
        }
      };
      
      setUserRequests(prev => ({ ...prev, ...newRequest }));
      
      alert(`${shop.name} işletmesine katılma isteğiniz gönderildi!`);
    } catch (error) {
      console.error('İstek gönderme hatası:', error);
      alert('İstek gönderilirken bir hata oluştu.');
    }
  };

  // Durum metnini Türkçe olarak almak için yardımcı fonksiyon
  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return 'Beklemede';
      case 'approved': return 'Onaylandı';
      case 'rejected': return 'Reddedildi';
      default: return status;
    }
  };

  // İstek butonunu veya durumunu görüntülemek için fonksiyon
  const renderRequestButton = (shop) => {
    // Kullanıcı daha önce istek göndermişse, durumu göster
    if (userRequests[shop.id]) {
      const request = userRequests[shop.id];
      
      // Eğer istek reddedilmişse, yeniden istek gönderebilsin
      if (request.status === 'rejected') {
        return (
          <div className="request-status">
            <span>Durum: {getStatusText(request.status)}</span>
            <button className='istek' onClick={() => handleJoinRequest(shop)}>
              Tekrar İstek Gönder
            </button>
          </div>
        );
      }
      
      // Diğer durumlarda sadece durumu göster
      return (
        <div className="request-status">
          <span>Durum: {getStatusText(request.status)}</span>
        </div>
      );
    }
    
    // Henüz istek gönderilmemişse, istek gönderme butonu göster
    return (
      <button className='istek' onClick={() => handleJoinRequest(shop)}>
        Katılma İsteği Gönder
      </button>
    );
  };

  return (
    <div>
      <header>
        <h1 className='logo'>Mrket</h1>
        
        {logİn && <h2 className='message'>Hoşgeldin {userName}</h2>}

        {logİn && (
          <div className="header-buttons">
            <button className={`nav-button ${showShopList ? 'active' : ''}`} onClick={showShopsView}>
              İşletme Listesi
            </button>
            <button className={`nav-button ${showRequests ? 'active' : ''}`} onClick={showRequestsView}>
              İsteklerim
            </button>
            <button className={`nav-button ${showMemberships ? 'active' : ''}`} onClick={showMembershipsView}>
              Üyeliklerim
            </button>
          </div>
        )}

        {logİn && showShopList && <input
          className='search'
          type="text"
          placeholder='Bir işletme ara...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />}
        
        {logOut && <h2>Mrket'e Hoşgeldin</h2>}

        {logOut && <button className='singup' onClick={() => navigate("/singup")}>Kaydol/Giriş yap</button>}
        {logİn && <button className='singup' onClick={handleLogout}>Çıkış Yap</button>}
      </header>

      {/* İşletme Listesi Görünümü */}
      {logİn && showShopList && (
        <div className='shop-list'>
          <h3>İşletme Listesi</h3>
          {filteredShops.length > 0 ? (
            <ul>
              {filteredShops.map((shop) => (
                <div className='shopName' key={shop.id}>
                  {shop.name}  
                  <hr />
                  {renderRequestButton(shop)}
                </div>
              ))}
            </ul>
          ) : (
            <p>Sonuç bulunamadı.</p>
          )}
        </div>
      )}

      {/* İstekler Görünümü */}
      {logİn && showRequests && (
        <div className='requests-list'>
          <h3>İsteklerim</h3>
          {Object.keys(userRequests).length > 0 ? (
            <ul>
              {Object.keys(userRequests).map((shopId) => (
                <div className='request-item' key={shopId}>
                  <h4>{userRequests[shopId].shopName}</h4>
                  <p>Durum: {getStatusText(userRequests[shopId].status)}</p>
                  {userRequests[shopId].status === 'rejected' && (
                    <button 
                      className='istek' 
                      onClick={() => handleJoinRequest({id: shopId, name: userRequests[shopId].shopName})}
                    >
                      Tekrar İstek Gönder
                    </button>
                  )}
                </div>
              ))}
            </ul>
          ) : (
            <p>Henüz hiç istek göndermediniz.</p>
          )}
        </div>
      )}

      {/* Üyelikler Görünümü */}
      {logİn && showMemberships && (
        <div className='memberships-list'>
          <h3>Üyeliklerim</h3>
          {userMemberships.length > 0 ? (
            <ul>
              {userMemberships.map((membership, index) => (
                <div className='membership-item' key={index}>
                  <h4>{membership.shopName}</h4>
                  <button 
                    className='leave-button' 
                    onClick={() => handleLeaveShop(membership.shopId, membership.memberId)}
                  >
                    İşletmeden Ayrıl
                  </button>
                </div>
              ))}
            </ul>
          ) : (
            <p>Henüz hiçbir işletmeye üye değilsiniz.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Home;