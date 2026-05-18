"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase, uploadTreatImage } from '@/lib/supabase';
import { Plus, Edit2, Trash2, X, CheckCircle, XCircle, ArrowLeft, Loader2, PackageSearch, DollarSign, Image as ImageIcon, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';

export default function InventoryManagement() {
  const [treats, setTreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const { hasMore, resetPage, nextPage, evaluateHasMore } = usePagination(15);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTreat, setEditingTreat] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const initialFormState = {
    name: '', description: '', category: 'cakes', price: '', cost_to_make: '', image_url: '', is_available: true
  };
  const [formData, setFormData] = useState(initialFormState);

 const fetchTreats = useCallback(async (range, search, category, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    let query = supabase
      .from('treats')
      .select('*', { count: 'exact' })
      // FIXED: Sorting by id instead of the missing created_at column
      .order('id', { ascending: false }) 
      .range(range.from, range.to);

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error("Error fetching treats:", error);
    } else if (data) {
      setTreats(prev => append ? [...prev, ...data] : data);
      evaluateHasMore(range.from + data.length, count);
    }
    
    setLoading(false);
    setLoadingMore(false);
  }, [evaluateHasMore]);

  useEffect(() => {
    const range = resetPage();
    fetchTreats(range, debouncedSearch, categoryFilter, false);
  }, [debouncedSearch, categoryFilter, fetchTreats, resetPage]);

  const loadMore = () => {
    const range = nextPage();
    fetchTreats(range, debouncedSearch, categoryFilter, true);
  };

  // --- Modal & Form Logic ---
  const handleOpenModal = (treat = null) => {
    if (treat) {
      setEditingTreat(treat);
      setFormData({
        name: treat.name, description: treat.description || '', category: treat.category,
        price: treat.price, cost_to_make: treat.cost_to_make || '', image_url: treat.image_url || '', is_available: treat.is_available
      });
    } else {
      setEditingTreat(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTreat(null);
    setFormData(initialFormState);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageUpload = async (e) => {
    try {
      setUploadingImage(true);
      const file = e.target.files[0];
      if (!file) return;
      const url = await uploadTreatImage(file);
      if (url) setFormData({ ...formData, image_url: url });
    } catch (error) {
      alert("Error uploading image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      cost_to_make: parseFloat(formData.cost_to_make) || 0,
      image_url: formData.image_url || 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop'
    };

    try {
      if (editingTreat) {
        const { error } = await supabase.from('treats').update(payload).eq('id', editingTreat.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('treats').insert([payload]);
        if (error) throw error;
      }
      const range = resetPage();
      await fetchTreats(range, debouncedSearch, categoryFilter, false);
      handleCloseModal();
    } catch (error) {
      alert("Error saving treat: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('treats').delete().eq('id', id);
      if (error) throw error;
      const range = resetPage();
      fetchTreats(range, debouncedSearch, categoryFilter, false);
    } catch (error) {
      alert("Error deleting treat: " + error.message);
    }
  };

  const toggleAvailability = async (treat) => {
    try {
      const { error } = await supabase.from('treats').update({ is_available: !treat.is_available }).eq('id', treat.id);
      if (error) throw error;
      setTreats(treats.map(t => t.id === treat.id ? { ...t, is_available: !t.is_available } : t));
    } catch (error) {
      alert("Error updating availability.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans pb-20">
      
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-3 bg-gray-50 rounded-full hover:bg-amber-50 hover:text-amber-600 transition">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Inventory Details</h1>
              <p className="text-gray-500 font-medium text-sm">Add, edit, and manage your menu items.</p>
            </div>
          </div>

          <button 
            onClick={() => handleOpenModal()}
            className="bg-gray-900 hover:bg-black text-white font-bold py-3.5 px-8 rounded-2xl transition shadow-xl flex items-center gap-2 w-full md:w-auto justify-center shrink-0"
          >
            <Plus className="w-5 h-5" />
            Add New Treat
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-400 transition font-bold text-gray-700 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <Filter className="w-5 h-5 text-gray-400 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full lg:w-auto bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-amber-400 font-bold appearance-none cursor-pointer capitalize"
            >
              <option value="all">All Categories</option>
              <option value="cakes">Cakes</option>
              <option value="cookies">Cookies</option>
              <option value="breads">Breads</option>
              <option value="pastries">Pastries</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                <th className="px-6 py-5">Item</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5">Financials</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : treats.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <PackageSearch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold text-lg">No treats match your filters.</p>
                  </td>
                </tr>
              ) : (
                treats.map((treat) => (
                  <tr key={treat.id} className="hover:bg-amber-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                          {treat.image_url ? (
                            <img src={treat.image_url} alt={treat.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-black text-gray-900">{treat.name}</p>
                          <p className="text-xs font-bold text-gray-400 truncate max-w-[200px]">{treat.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                        {treat.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-black text-gray-900 flex items-center gap-1">
                          <span className="text-[10px] text-gray-400 uppercase tracking-widest w-12">Price:</span> 
                          ${Number(treat.price).toFixed(2)}
                        </p>
                        <p className="text-sm font-bold text-red-500 flex items-center gap-1">
                          <span className="text-[10px] text-gray-400 uppercase tracking-widest w-12">Cost:</span> 
                          ${Number(treat.cost_to_make || 0).toFixed(2)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleAvailability(treat)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                          treat.is_available 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {treat.is_available ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {treat.is_available ? 'Available' : 'Sold Out'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(treat)}
                          className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition"
                          title="Edit"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(treat.id, treat.name)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Load More Button */}
        {hasMore && !loading && (
          <div className="p-4 border-t border-gray-100 flex justify-center bg-gray-50">
            <button 
              onClick={loadMore}
              disabled={loadingMore}
              className="bg-white border border-gray-200 text-gray-700 font-bold py-2.5 px-6 rounded-xl shadow-sm hover:bg-gray-100 transition flex items-center gap-2"
            >
              {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load More Treats"}
            </button>
          </div>
        )}
      </div>

      {/* --- Modal Form --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-200 my-8">
            
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-black text-gray-900">{editingTreat ? 'Edit Treat' : 'Add New Treat'}</h2>
                <p className="text-xs font-bold text-gray-500 mt-1">Update menu details, financials, and images.</p>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-2 bg-white border border-gray-200 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Item Name</label>
                  <input 
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Chocolate Chip Cookie"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-400 transition font-bold text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Category</label>
                  <select 
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-400 transition font-bold text-gray-900 appearance-none"
                  >
                    <option value="cakes">Cakes</option>
                    <option value="cookies">Cookies</option>
                    <option value="breads">Breads</option>
                    <option value="pastries">Pastries</option>
                  </select>
                </div>

                <div className="row-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Treat Image</label>
                  <div className="flex flex-col gap-4">
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-400 transition font-bold text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 cursor-pointer"
                    />
                    
                    <div className="flex items-center gap-4">
                      {uploadingImage && <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />}
                      {formData.image_url && !uploadingImage && (
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-200 shadow-sm shrink-0">
                          <img 
                            src={formData.image_url} 
                            alt="Treat preview" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 p-5 rounded-[1.5rem] border border-amber-100">
                  <label className="block text-xs font-black text-amber-800 uppercase tracking-widest mb-2">Sale Price ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      placeholder="0.00"
                      className="w-full pl-11 pr-4 py-3 bg-white border border-amber-200 rounded-xl outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-400 transition font-black text-gray-900"
                    />
                  </div>
                </div>

                <div className="bg-red-50 p-5 rounded-[1.5rem] border border-red-100">
                  <label className="block text-xs font-black text-red-800 uppercase tracking-widest mb-2">Cost to Make ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-600" />
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      name="cost_to_make"
                      value={formData.cost_to_make}
                      onChange={handleInputChange}
                      required
                      placeholder="0.00"
                      className="w-full pl-11 pr-4 py-3 bg-white border border-red-200 rounded-xl outline-none focus:ring-4 focus:ring-red-100 focus:border-red-400 transition font-black text-gray-900"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Describe the treat, ingredients, etc."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-400 transition font-bold text-gray-900 resize-none"
                  ></textarea>
                </div>

                <div className="md:col-span-2 flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <input 
                    type="checkbox"
                    id="is_available"
                    name="is_available"
                    checked={formData.is_available}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-amber-600 bg-white border-gray-300 rounded focus:ring-amber-500 focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="is_available" className="font-bold text-gray-700 cursor-pointer select-none">
                    Item is currently available for purchase
                  </label>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-2xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || uploadingImage}
                  className="flex-1 bg-gray-900 hover:bg-black text-white font-black py-4 rounded-2xl transition shadow-xl disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Treat'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}