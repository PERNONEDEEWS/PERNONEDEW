import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { UserPlus, Trash2, Loader, Search, X, Users, Shield, Hash } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface CashierCred {
  id: string;
  profile_id: string;
  full_name: string;
  id_number: string;
  created_by: string;
  created_at: string;
}

export function CashierManagement() {
  const [cashiers, setCashiers] = useState<CashierCred[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newIdNumber, setNewIdNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const { signUpCashier } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    fetchCashiers();

    const subscription = supabase
      .channel('cashier-creds')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cashier_credentials' }, () => {
        fetchCashiers();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchCashiers = async () => {
    try {
      const { data, error } = await supabase
        .from('cashier_credentials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCashiers(data || []);
    } catch (err) {
      console.error('Error fetching cashiers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newIdNumber.trim() || !newPassword.trim()) return;

    setCreating(true);
    try {
      await signUpCashier(newFullName.trim(), newIdNumber.trim(), newPassword.trim());
      showToast('success', `Cashier "${newFullName.trim()}" created successfully!`);
      setNewFullName('');
      setNewIdNumber('');
      setNewPassword('');
      setShowCreateForm(false);
      await fetchCashiers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create cashier';
      showToast('error', message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCashier = async (cashier: CashierCred) => {
    if (!confirm(`Remove cashier "${cashier.full_name}"? This will delete their account.`)) return;

    try {
      const { error } = await supabase
        .from('cashier_credentials')
        .delete()
        .eq('id', cashier.id);

      if (error) throw error;

      await supabase.auth.admin.deleteUser(cashier.profile_id);

      showToast('success', `Cashier "${cashier.full_name}" removed.`);
      await fetchCashiers();
    } catch (err) {
      console.error('Error deleting cashier:', err);
      showToast('error', 'Failed to remove cashier.');
    }
  };

  const filteredCashiers = cashiers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.full_name.toLowerCase().includes(q) || c.id_number.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">Cashier Management</h2>
          <p className="text-gray-600 text-sm sm:text-base">Create and manage cashier accounts</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-700 to-teal-600 text-white px-5 py-3 rounded-xl font-semibold hover:from-teal-800 hover:to-teal-700 transition shadow-lg"
        >
          <UserPlus className="w-5 h-5" />
          Add Cashier
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-teal-700 to-teal-600 text-white rounded-xl shadow-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 opacity-80" />
            <span className="text-sm font-medium opacity-80">Total Cashiers</span>
          </div>
          <p className="text-4xl font-bold">{cashiers.length}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-700 to-slate-600 text-white rounded-xl shadow-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 opacity-80" />
            <span className="text-sm font-medium opacity-80">Active Staff</span>
          </div>
          <p className="text-4xl font-bold">{cashiers.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or ID number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cashiers List */}
      {filteredCashiers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Cashiers Found</h3>
          <p className="text-gray-500">
            {searchQuery ? 'No cashiers match your search.' : 'Click "Add Cashier" to create the first cashier account.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Full Name</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">ID Number</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Date Created</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCashiers.map((cashier) => (
                  <tr key={cashier.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-teal-600 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {cashier.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-800">{cashier.full_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold font-mono">
                        {cashier.id_number}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {new Date(cashier.created_at).toLocaleDateString('en-PH', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleDeleteCashier(cashier)}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition font-medium text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
            Showing {filteredCashiers.length} of {cashiers.length} cashiers
          </div>
        </div>
      )}

      {/* Create Cashier Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-teal-700 to-teal-600 text-white p-6 text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-1">Add New Cashier</h2>
              <p className="text-teal-100 text-sm">Fill in the cashier's details below</p>
            </div>

            <div className="p-6">
              <form onSubmit={handleCreateCashier} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    required
                    autoFocus
                    maxLength={100}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition text-gray-800"
                    placeholder="e.g. Maria Santos"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ID Number
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={newIdNumber}
                      onChange={(e) => setNewIdNumber(e.target.value)}
                      required
                      maxLength={30}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition text-gray-800"
                      placeholder="e.g. CASH-001"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">This will be the cashier's login username.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition text-gray-800"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewFullName('');
                      setNewIdNumber('');
                      setNewPassword('');
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-gradient-to-r from-teal-700 to-teal-600 text-white py-3 rounded-xl font-bold hover:from-teal-800 hover:to-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        Create Cashier
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
