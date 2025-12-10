import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../App.css'; // Assuming App.css has general styling
import { fetchProducts, fetchPrediction, checkRestock, recordSale, updateStock } from '../pages/api.js'; // Use absolute path alias

function Dashboard() {
  const [session, setSession] = useState(null);
  const [userMetadata, setUserMetadata] = useState(null);
  const [apiData, setApiData] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(true);

  // AI Feature States
  const [productIdInput, setProductIdInput] = useState('');
  const [predictionResult, setPredictionResult] = useState(null);
  const [restockResult, setRestockResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Sales/Restock Feature States
  const [transactionType, setTransactionType] = useState('SALE'); // 'SALE' or 'RESTOCK'
  const [salePid, setSalePid] = useState('');
  const [saleQty, setSaleQty] = useState('');
  const [saleLoading, setSaleLoading] = useState(false);
  const [saleMsg, setSaleMsg] = useState(null);
  const [saleError, setSaleError] = useState(null);

  // Restock Execution State
  const [execLoading, setExecLoading] = useState(false);
  const [execMsg, setExecMsg] = useState(null);

  const navigate = useNavigate();

  // ... (useEffect and auth logic remains the same) ...

  const handleStockTransaction = async () => {
    if (!salePid || !saleQty) return;
    setSaleLoading(true);
    setSaleMsg(null);
    setSaleError(null);

    try {
      if (transactionType === 'SALE') {
        await recordSale(salePid, saleQty);
        setSaleMsg(`Penjualan Berhasil! Dikurangi ${saleQty} unit dari Produk ${salePid}`);
      } else {
        await updateStock(salePid, saleQty, "Manual Restock");
        setSaleMsg(`Restock Berhasil! Ditambah ${saleQty} unit ke Produk ${salePid}`);
      }

      setSalePid('');
      setSaleQty('');
    } catch (err) {
      setSaleError(err.message);
    } finally {
      setSaleLoading(false);
    }
  };

  // Keep handleRecordSale if needed for legacy or remove it. 
  // For safety, defining it as alias to handleStockTransaction if any old ref, but UI is updated.
  // REMOVED to fix redeclaration error. We only use handleStockTransaction now.

  useEffect(() => {
    const backendToken = localStorage.getItem('backend_token');
    if (backendToken) {
      try {
        const payload = JSON.parse(atob(backendToken.split('.')[1]));
        const email = payload.email || localStorage.getItem('backend_user_email') || '';
        const role = payload.role || 'user';

        setSession({ user: { email } });
        setUserMetadata({ role: role });
      } catch (e) {
        console.error("Failed to decode token:", e);
        const email = localStorage.getItem('backend_user_email') || '';
        setSession({ user: { email } });
        setUserMetadata({ role: 'user' });
      }
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setUserMetadata(session.user.user_metadata);
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) {
          setUserMetadata(session.user.user_metadata);
        } else {
          setUserMetadata(null);
          setApiData(null);
          navigate('/login');
        }
      }
    );

    return () => {
      if (authListener && authListener.subscription) authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    const backendToken = localStorage.getItem('backend_token');
    if (backendToken) {
      localStorage.removeItem('backend_token');
      localStorage.removeItem('backend_user_email');
      setSession(null);
      setUserMetadata(null);
      setApiData(null);
      navigate('/login');
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error during logout:', error.message);
      setApiError('Failed to logout: ' + error.message);
    } else {
      setSession(null);
      setUserMetadata(null);
      setApiData(null);
      navigate('/login');
    }
  };

  const fetchProtectedData = async () => {
    setApiData(null);
    setApiError(null);
    try {
      const data = await fetchProducts();
      setApiData(data);
    } catch (error) {
      console.error("Error saat mengambil data:", error);
      setApiError(error.message);
    }
  };

  const handleAnalyze = async () => {
    if (!productIdInput) return;
    setAiLoading(true);
    setAiError(null);
    setPredictionResult(null);
    setRestockResult(null);
    setExecMsg(null); // Reset exec message

    try {
      const predData = await fetchPrediction(productIdInput);
      setPredictionResult(predData);

      const restockData = await checkRestock(
        predData.product_id,
        predData.current_stock,
        predData.predicted_demand_next_7_days
      );
      setRestockResult(restockData);

    } catch (err) {
      console.error("Analisis AI gagal:", err);
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleRecordSale = async () => {
    if (!salePid || !saleQty) return;
    setSaleLoading(true);
    setSaleMsg(null);
    setSaleError(null);

    try {
      await recordSale(salePid, saleQty);
      setSaleMsg(`Success! Sold ${saleQty} of Product ${salePid}`);
      setSalePid('');
      setSaleQty('');
    } catch (err) {
      setSaleError(err.message);
    } finally {
      setSaleLoading(false);
    }
  };

  const handleExecuteOrder = async () => {
    if (!restockResult || restockResult.decision !== 'ORDER') return;
    setExecLoading(true);
    setExecMsg(null);

    try {
      await updateStock(predictionResult.product_id, restockResult.amount, "AI Restock Execution");
      setExecMsg("Order Dieksekusi! Stok Diperbarui.");

      // Refresh prediction to show updated stock
      handleAnalyze();
    } catch (err) {
      setExecMsg(`Gagal: ${err.message}`);
    } finally {
      setExecLoading(false);
    }
  };

  if (loading) {
    return <div>Memuat...</div>;
  }

  const role = userMetadata?.role;
  const canSeeSales = role === 'staff' || role === 'manager';
  const canSeeAI = role === 'manager';

  return (
    <div className="App">
      <header className="App-header">
        <h1>Dashboard Sistem Inventaris AI</h1>
        {session && session.user ? (
          <div>
            <p>Selamat datang, {session.user.email}!</p>
            {role && <p>Peran Anda: <strong>{role.toUpperCase()}</strong></p>}
            <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}>Keluar</button>
            <hr style={{ margin: '20px 0' }} />

            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'flex-start' }}>

              {/* 1. Product List Section - Visible to ALL */}
              <div style={{ padding: '20px', border: '1px solid #555', borderRadius: '10px', width: '300px' }}>
                <h3>Data Produk</h3>
                <button onClick={fetchProtectedData} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Ambil Data Produk</button>
                {apiData && (
                  <div style={{ textAlign: 'left', marginTop: '20px', backgroundColor: '#333', padding: '15px', borderRadius: '8px', color: 'white', maxHeight: '300px', overflow: 'auto' }}>
                    <pre style={{ fontSize: '0.8em' }}>{JSON.stringify(apiData, null, 2)}</pre>
                  </div>
                )}
                {apiError && (
                  <p style={{ color: 'red' }}>Error: {apiError}</p>
                )}
              </div>

              {/* 2. Stock Management Section - Staff & Manager */}
              {canSeeSales && (
                <div style={{ padding: '20px', border: '1px solid #17a2b8', borderRadius: '10px', width: '300px', backgroundColor: 'rgba(23, 162, 184, 0.1)' }}>
                  <h3>Kelola Stok / Transaksi</h3>

                  {/* Transaction Type Toggle - ONLY FOR MANAGERS */}
                  {userMetadata?.role === 'manager' && (
                    <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '15px' }}>
                      <label style={{ cursor: 'pointer', fontWeight: transactionType === 'SALE' ? 'bold' : 'normal', color: transactionType === 'SALE' ? '#dc3545' : '#ccc' }}>
                        <input
                          type="radio"
                          name="transType"
                          value="SALE"
                          checked={transactionType === 'SALE'}
                          onChange={() => setTransactionType('SALE')}
                          style={{ marginRight: '5px' }}
                        />
                        Penjualan (Keluar)
                      </label>
                      <label style={{ cursor: 'pointer', fontWeight: transactionType === 'RESTOCK' ? 'bold' : 'normal', color: transactionType === 'RESTOCK' ? '#28a745' : '#ccc' }}>
                        <input
                          type="radio"
                          name="transType"
                          value="RESTOCK"
                          checked={transactionType === 'RESTOCK'}
                          onChange={() => setTransactionType('RESTOCK')}
                          style={{ marginRight: '5px' }}
                        />
                        Restock (Masuk)
                      </label>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                      type="number" placeholder="ID Produk" value={salePid} onChange={e => setSalePid(e.target.value)}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <input
                      type="number" placeholder="Jumlah" value={saleQty} onChange={e => setSaleQty(e.target.value)}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <button
                      onClick={handleStockTransaction}
                      disabled={saleLoading}
                      style={{ padding: '8px', backgroundColor: transactionType === 'SALE' ? '#dc3545' : '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      {saleLoading ? 'Menyimpan...' : (transactionType === 'SALE' ? 'Simpan Penjualan' : 'Simpan Stok Masuk')}
                    </button>
                  </div>
                  {saleMsg && <p style={{ color: transactionType === 'SALE' ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>{saleMsg}</p>}
                  {saleError && <p style={{ color: 'red' }}>{saleError}</p>}
                </div>
              )}

              {/* 3. AI Analysis Section - Manager Only */}
              {canSeeAI && (
                <div style={{ padding: '20px', border: '1px solid #28a745', borderRadius: '10px', width: '300px', backgroundColor: 'rgba(40, 167, 69, 0.1)' }}>
                  <h3>Dukungan Keputusan AI</h3>
                  <div style={{ marginBottom: '15px' }}>
                    <input
                      type="number"
                      placeholder="ID Produk (cth. 1)"
                      value={productIdInput}
                      onChange={(e) => setProductIdInput(e.target.value)}
                      style={{ padding: '8px', marginRight: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100px' }}
                    />
                    <button onClick={handleAnalyze} disabled={aiLoading} style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                      {aiLoading ? 'Menganalisis...' : 'Analisis'}
                    </button>
                  </div>

                  {aiError && <p style={{ color: 'red', fontSize: '0.9em' }}>{aiError}</p>}

                  {predictionResult && (
                    <div style={{ textAlign: 'left', backgroundColor: '#222', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#ffc107' }}>Prediksi</h4>
                      <p style={{ margin: '5px 0', fontWeight: 'bold', color: '#fff' }}>{predictionResult.product_name}</p>
                      <p style={{ margin: '5px 0', fontSize: '0.9em', color: '#aaa' }}>ID: {predictionResult.product_id}</p>
                      <p style={{ margin: '5px 0' }}>Stok Saat Ini: {predictionResult.current_stock}</p>
                      <p style={{ margin: '5px 0' }}>Est. Permintaan (7 Hari): <strong>{predictionResult.predicted_demand_next_7_days}</strong></p>
                    </div>
                  )}

                  {restockResult && (
                    <div style={{ textAlign: 'left', backgroundColor: '#222', padding: '10px', borderRadius: '5px' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#17a2b8' }}>Keputusan Restock</h4>
                      <p style={{ margin: '5px 0' }}>Keputusan:
                        <span style={{ fontWeight: 'bold', marginLeft: '5px', color: restockResult.decision === 'ORDER' ? '#dc3545' : '#28a745' }}>
                          {restockResult.decision}
                        </span>
                      </p>
                      {restockResult.decision === 'ORDER' && (
                        <div>
                          <p style={{ margin: '5px 0' }}>Rekomendasi Pesanan: <strong>{restockResult.amount} unit</strong></p>
                          <button onClick={handleExecuteOrder} disabled={execLoading} style={{ marginTop: '10px', padding: '8px 15px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                            {execLoading ? 'Memproses...' : 'Eksekusi Order'}
                          </button>
                          {execMsg && <p style={{ fontSize: '0.9em', color: execMsg.includes('Berhasil') || execMsg.includes('Dieksekusi') ? '#28a745' : '#dc3545' }}>{execMsg}</p>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        ) : (
          <p>Memuat informasi pengguna...</p>
        )}
      </header>
    </div>
  );
}

export default Dashboard;