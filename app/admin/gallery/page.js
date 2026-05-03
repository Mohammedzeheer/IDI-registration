'use client';
import  { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, CheckCircle, AlertCircle, XCircle, Upload, Eye, Download, FileImage } from 'lucide-react';

const GalleryManagement = () => {
  const [galleries, setGalleries] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch galleries
  const fetchGalleries = async (page = 1) => {
    try {
      const response = await fetch(`/api/gallery?page=${page}&limit=10`);
      const data = await response.json();
      setGalleries(data.galleries || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error('Error fetching galleries:', error);
      showToast('Failed to fetch galleries', 'error');
    }
  };

  useEffect(() => {
    fetchGalleries();
  }, []);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Add gallery item
  const handleAdd = async () => {
    if (!formData.title.trim()) {
      showToast('Please enter a title', 'error');
      return;
    }
    if (!selectedImage) {
      showToast('Please select an image', 'error');
      return;
    }

    setUploading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('image', selectedImage);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('tags', formData.tags);
      formDataToSend.append('isActive', formData.isActive);

      const response = await fetch('/api/gallery', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        await fetchGalleries(currentPage);
        setFormData({ title: '', description: '', tags: '', isActive: true });
        setSelectedImage(null);
        setPreviewUrl('');
        setShowAddForm(false);
        showToast('Gallery item added successfully', 'success');
      } else {
        throw new Error('Failed to add gallery item');
      }
    } catch (error) {
      console.error('Error adding gallery item:', error);
      showToast('Failed to add gallery item', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Edit gallery item
  const handleEdit = async (id) => {
    if (!formData.title.trim()) {
      showToast('Please enter a title', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/gallery', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          ...formData,
        }),
      });

      if (response.ok) {
        await fetchGalleries(currentPage);
        setEditingId(null);
        setFormData({ title: '', description: '', tags: '', isActive: true });
        showToast('Gallery item updated successfully', 'success');
      } else {
        throw new Error('Failed to update gallery item');
      }
    } catch (error) {
      console.error('Error updating gallery item:', error);
      showToast('Failed to update gallery item', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete gallery item
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this gallery item?')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/gallery', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        await fetchGalleries(currentPage);
        showToast('Gallery item deleted successfully', 'success');
      } else {
        throw new Error('Failed to delete gallery item');
      }
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      showToast('Failed to delete gallery item', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Start editing
  const startEdit = (gallery) => {
    setEditingId(gallery._id);
    setFormData({
      title: gallery.title,
      description: gallery.description || '',
      tags: gallery.tags ? gallery.tags.join(', ') : '',
      isActive: gallery.isActive
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ title: '', description: '', tags: '', isActive: true });
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchGalleries(page);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 
          toast.type === 'error' ? 'bg-red-600 text-white' : 
          'bg-blue-600 text-white'
        }`}>
          {toast.type === 'success' && <CheckCircle size={20} />}
          {toast.type === 'error' && <XCircle size={20} />}
          {toast.type === 'info' && <AlertCircle size={20} />}
          <span>{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            className="ml-2 hover:opacity-70"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Gallery Management</h1>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Add Gallery Item
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter gallery title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Enter description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
                  </select>
                </div>
              </div>

              {/* Right Column - Image Upload */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image *
                  </label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    {previewUrl ? (
                      <div className="space-y-4">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => {
                            setSelectedImage(null);
                            setPreviewUrl('');
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <FileImage size={48} className="mx-auto text-gray-400" />
                        <div>
                          <p className="text-gray-600">Click to upload or drag and drop</p>
                          <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={uploading}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Upload size={16} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Add Gallery Item
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Gallery Grid */}
        <div className="p-6">
          {galleries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No gallery items found. Add your first gallery item!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {galleries.map((gallery) => (
                <div key={gallery._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative">
                    <img 
                      src={gallery.imageUrl} 
                      alt={gallery.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        gallery.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {gallery.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    {editingId === gallery._id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="2"
                        />
                        <input
                          type="text"
                          value={formData.tags}
                          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Tags (comma separated)"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(gallery._id)}
                            disabled={loading}
                            className="flex-1 bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                          >
                            <Save size={14} className="inline mr-1" />
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex-1 bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 transition-colors text-sm"
                          >
                            <X size={14} className="inline mr-1" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900 truncate">{gallery.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{gallery.description}</p>
                        {gallery.tags && gallery.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {gallery.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(gallery)}
                            className="flex-1 bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors text-sm"
                          >
                            <Edit size={14} className="inline mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(gallery._id)}
                            disabled={loading}
                            className="flex-1 bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                          >
                            <Trash2 size={14} className="inline mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                {currentPage > 1 && (
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                )}
                
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 border rounded-md ${
                      currentPage === page
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                {currentPage < pagination.pages && (
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleryManagement;