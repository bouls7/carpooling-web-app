export default function AdminPage() {
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { activeAccount } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeAccount || activeAccount.role !== "admin") {
      navigate("/");
      return;
    }
    fetchPendingDrivers();
  }, [activeAccount]);

  const fetchPendingDrivers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/unverified-drivers", {
        headers: { Authorization: `Bearer ${activeAccount.token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      setPendingDrivers(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      const res = await fetch(`/api/admin/${action}-driver/${id}`, {
        method: action === "approve" ? "POST" : "DELETE",
        headers: { Authorization: `Bearer ${activeAccount.token}` },
      });
      if (!res.ok) throw new Error(`Failed to ${action}`);
      setPendingDrivers(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="admin-dashboard">
      <h2>Pending Driver Approvals</h2>
      {pendingDrivers.length === 0 ? (
        <p>No pending drivers.</p>
      ) : (
        <table>
          {/* ... existing table code ... */}
          <button onClick={() => handleAction(driver.id, "approve")}>✅ Approve</button>
          <button onClick={() => handleAction(driver.id, "reject")}>❌ Reject</button>
        </table>
      )}
    </div>
  );
}