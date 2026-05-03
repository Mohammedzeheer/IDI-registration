'use client';
import { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle, XCircle, AlertCircle, RefreshCw, Download, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminQRScanner() {
  const [activeTab, setActiveTab] = useState('checkins'); // 'scanner' or 'checkins'
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Check-in list state
  const [checkins, setCheckins] = useState([]);
  const [filters, setFilters] = useState({
    school: '',
    class: '',
    division: '',
    search: ''
  });
  const [filterOptions, setFilterOptions] = useState({
    schools: [],
    classes: [],
    divisions: []
  });
  const [stats, setStats] = useState({
    totalCheckedIn: 0,
    todayCheckedIn: 0
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 1050
  });

  useEffect(() => {
    if (activeTab === 'checkins') {
      fetchCheckins();
    }
  }, [activeTab, filters, pagination.currentPage]);

  const fetchCheckins = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        ...(filters.school && { school: filters.school }),
        ...(filters.class && { class: filters.class }),
        ...(filters.division && { division: filters.division }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/admin/checkins?${params}`);
      const result = await response.json();

      if (result.success) {
        setCheckins(result.data.checkins);
        setPagination(result.data.pagination);
        setFilterOptions(result.data.filters);
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error('Error fetching check-ins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      school: '',
      class: '',
      division: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const exportToExcel = () => {
    const headers = ['Fest ID', 'Name', 'Phone', 'Class', 'Division', 'School', 'Checked In At'];
    const csvData = checkins.map(student => [
      student.festId || 'N/A',
      student.name || 'N/A',
      student.phone,
      student.class || 'N/A',
      student.division || 'N/A',
      student.school || 'N/A',
      new Date(student.checkedInAt).toLocaleString()
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checkins_${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScanning(true);

        scanIntervalRef.current = setInterval(() => {
          captureAndDecode();
        }, 500);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setScanning(false);
  };

  const captureAndDecode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      if (typeof window.jsQR !== 'undefined') {
        const code = window.jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          handleQRDetected(code.data);
        }
      }
    }
  };

  const handleQRDetected = async (qrData) => {
    stopScanning();
    setLoading(true);

    try {
      const studentInfo = JSON.parse(decodeURIComponent(qrData));

      const response = await fetch('/api/admin/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          festId: studentInfo.festId,
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStudentData(result.student);
        setScanResult('success');
        toast.success(`Check-in successful for ${result.student.name}!`);
      } else {
        setScanResult('error');
        toast.error(result.message || 'Check-in failed');
      }
    } catch (error) {
      console.error('QR processing error:', error);
      setScanResult('error');
      toast.error('Invalid QR code or processing error');
    } finally {
      setLoading(false);
    }
  };

  const [manualInput, setManualInput] = useState('');

  const handleManualCheckin = async () => {
    if (!manualInput.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ festId: manualInput.trim() })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStudentData(result.student);
        setScanResult('success');
        setManualInput('');
        toast.success(`Check-in successful for ${result.student.name}!`);
      } else {
        setScanResult('error');
        toast.error(result.message || 'Check-in failed');
      }
    } catch (error) {
      console.error('Manual check-in error:', error);
      setScanResult('error');
      toast.error('Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setStudentData(null);
    setScanResult(null);
    setManualInput('');
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  useEffect(() => {
    if (!document.querySelector('script[src*="jsqr"]')) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsqr/1.4.0/jsQR.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Tabs */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-3">
            <Camera className="w-8 h-8 text-indigo-600" />
            Student Check-In Management
          </h1>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-200">

            <button
              onClick={() => setActiveTab('checkins')}
              className={`px-6 py-3 font-medium transition-all ${activeTab === 'checkins'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Check-In Students
            </button>
            <button
              onClick={() => setActiveTab('scanner')}
              className={`px-6 py-3 font-medium transition-all ${activeTab === 'scanner'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Check-In
            </button>
          </div>
        </div>

        {/* Scanner Tab */}
        {activeTab === 'scanner' && (
          <>
            {!studentData && !scanResult && (
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                <div className="space-y-6">
                  {/* <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Scan QR Code</h2>

                    {!scanning ? (
                      <button
                        onClick={startScanning}
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Camera size={24} />
                        Start Camera Scanner
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative bg-black rounded-xl overflow-hidden">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-96 object-cover"
                          />
                          <div className="absolute inset-0 border-4 border-indigo-500 m-12 rounded-xl pointer-events-none"></div>
                        </div>
                        <button
                          onClick={stopScanning}
                          className="w-full bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <X size={20} />
                          Stop Scanner
                        </button>
                      </div>
                    )}

                    <canvas ref={canvasRef} className="hidden" />
                  </div> */}

                  {/* <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500 font-medium">OR</span>
                    </div>
                  </div> */}

                  <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Manual Check-In</h2>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleManualCheckin()}
                        placeholder="Enter ID (e.g., IDI123456)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                        disabled={loading}
                      />
                      <button
                        onClick={handleManualCheckin}
                        disabled={loading || !manualInput.trim()}
                        className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Processing...' : 'Check In'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {scanResult && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                {scanResult === 'success' && studentData ? (
                  <div className="text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Check-In Successful!</h2>
                    <p className="text-gray-600 mb-6">Student has been checked in</p>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 mb-6 text-left">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-green-200 pb-3">
                          <span className="text-gray-600 font-medium">IDI ID:</span>
                          <span className="text-lg font-bold text-indigo-600">{studentData.festId}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-green-200 pb-3">
                          <span className="text-gray-600 font-medium">Name:</span>
                          <span className="text-lg font-semibold text-gray-800">{studentData.name}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-green-200 pb-3">
                          <span className="text-gray-600 font-medium">Class:</span>
                          <span className="text-gray-800">{studentData.class} - {studentData.division}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-green-200 pb-3">
                          <span className="text-gray-600 font-medium">School:</span>
                          <span className="text-gray-800 text-right text-sm">{studentData.school}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-medium">Phone:</span>
                          <span className="text-gray-800">{studentData.phone}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={resetScanner}
                      className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={20} />
                      Scan Next Student
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <XCircle className="w-12 h-12 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Check-In Failed</h2>
                    <p className="text-gray-600 mb-6">
                      Unable to check in student. Please verify the QR code or ID and try again.
                    </p>

                    <button
                      onClick={resetScanner}
                      className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={20} />
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Scanner Tips:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Ensure good lighting for QR scanning</li>
                  <li>Hold the QR code steady within the frame</li>
                  <li>Use manual input if camera scan fails</li>
                </ul>
              </div>
            </div> */}
          </>
        )}

        {/* Check-ins List Tab */}
        {activeTab === 'checkins' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Total Checked In</div>
                <div className="text-4xl font-bold text-green-600">{stats.totalCheckedIn}</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Today&apos;s Check-Ins</div>
                <div className="text-4xl font-bold text-blue-600">{stats.todayCheckedIn}</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <select
                  value={filters.school}
                  onChange={(e) => handleFilterChange('school', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Schools</option>
                  {filterOptions.schools.map(school => (
                    <option key={school} value={school}>{school}</option>
                  ))}
                </select>

                <select
                  value={filters.class}
                  onChange={(e) => handleFilterChange('class', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Classes</option>
                  {filterOptions.classes.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>

                <select
                  value={filters.division}
                  onChange={(e) => handleFilterChange('division', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Divisions</option>
                  {filterOptions.divisions.map(div => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Reset Filters
                </button>
                <button
                  onClick={exportToExcel}
                  className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export to Excel
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fest ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Division</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Checked In At</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <div className="flex justify-center items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                          </div>
                        </td>
                      </tr>
                    ) : checkins.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                          No check-ins found
                        </td>
                      </tr>
                    ) : (
                      checkins.map((student) => (
                        <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                            {student.festId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.phone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.class}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.division}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {student.school}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(student.checkedInAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!loading && checkins.length > 0 && (
                <div className="bg-white px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{((pagination.currentPage - 1) * pagination.limit) + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)}
                      </span> of{' '}
                      <span className="font-medium">{pagination.totalCount}</span> results
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                        disabled={pagination.currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>

                      <div className="flex items-center gap-1">
                        {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPagination(prev => ({ ...prev, currentPage: pageNum }))}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${pagination.currentPage === pageNum
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}