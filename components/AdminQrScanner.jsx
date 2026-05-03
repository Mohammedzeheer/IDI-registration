'use client';
import { useState, useEffect } from 'react';
import { QrReader } from "react-qr-reader";
import { Camera, X, CheckCircle, XCircle, AlertCircle, RefreshCw, Download, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminQRScanner() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [manualInput, setManualInput] = useState('');
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
    limit: 50
  });

  // Fetch Check-ins
  useEffect(() => {
    if (activeTab === 'checkins') {
      fetchCheckins();
    }
  }, [activeTab, filters, pagination.currentPage]);

  const fetchCheckins = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  /* ------------------ UPDATED SCAN FLOW ------------------ */
  const handleQRScan = async (result) => {
    if (!result?.text || !isScanning) return;

    setIsScanning(false);
    setLoading(true);

    try {
      const studentInfo = JSON.parse(decodeURIComponent(result.text));

      // Fetch student details BEFORE confirm check-in
      const response = await fetch(`/api/admin/students/${studentInfo._id}`);
      const data = await response.json();

      if (data.success) {
        setStudentData(data.student);
        setScanResult('preview'); // now show preview first
      } else {
        toast.error("Student not found");
        setScanResult('error');
      }
    } catch (error) {
      toast.error("Invalid QR Code");
      setScanResult('error');
    }
    setLoading(false);
  };

  const confirmCheckin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          festId: studentData.festId,
          studentId: studentData._id
        })
      });

      const data = await response.json();
      if (data.success) {
        setScanResult('success');
        toast.success(`Check-in successful for ${data.student.name}!`);
      } else {
        setScanResult('error');
        toast.error(data.message || 'Check-in failed');
      }
    } catch (error) {
      toast.error("Check-in failed");
      setScanResult('error');
    }
    setLoading(false);
  };

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
      if (result.success) {
        setStudentData(result.student);
        setScanResult('success');
        setManualInput('');
        toast.success(`Check-in successful for ${result.student.name}!`);
      } else {
        setScanResult('error');
        toast.error(result.message);
      }
    } catch (err) {
      toast.error("Check-in failed");
      setScanResult('error');
    }
    setLoading(false);
  };

  const resetScanner = () => {
    setStudentData(null);
    setScanResult(null);
    setManualInput('');
    setIsScanning(true);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
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
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `checkins_${Date.now()}.csv`;
    link.click();
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


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-3">
            <Camera className="w-8 h-8 text-indigo-600" />
            Student Check-In Management
          </h1>

          <div className="flex gap-2 border-b border-gray-200">
            <button onClick={() => setActiveTab('scanner')}
              className={`px-6 py-3 ${activeTab === 'scanner' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600'}`}>
              QR Scanner
            </button>

            <button onClick={() => setActiveTab('checkins')}
              className={`px-6 py-3 ${activeTab === 'checkins' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600'}`}>
              Check-In List
            </button>
          </div>
        </div>


        {/* ---------------- SCANNER TAB ---------------- */}
        {activeTab === 'scanner' && (
          <>

            {/* SCAN VIEW */}
            {!scanResult && !studentData && (
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                <h2 className="text-xl font-bold mb-3">Scan QR Code</h2>

                {isScanning && (
                  <div className="rounded-xl overflow-hidden shadow border bg-black">
                    <QrReader
                      constraints={{ facingMode: "environment" }}
                      onResult={(result) => result && handleQRScan(result)}
                      style={{ width: "100%" }}
                    />
                  </div>
                )}

                <div className="my-6 text-center text-gray-500 font-medium">OR</div>

                <h2 className="text-xl font-bold mb-3">Manual Check In</h2>
                <input
                  type="text"
                  placeholder="Enter Fest ID"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl mb-3"
                />
                <button onClick={handleManualCheckin}
                  className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium">Check In</button>
              </div>
            )}


            {/* ✅ PREVIEW SCREEN BEFORE CONFIRM */}
            {scanResult === 'preview' && studentData && (
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Confirm Student</h2>

                <div className="text-left space-y-2 mb-6">
                  <p><b>Name:</b> {studentData.name}</p>
                  <p><b>Fest ID:</b> {studentData.festId}</p>
                  <p><b>Class:</b> {studentData.class}-{studentData.division}</p>
                  <p><b>School:</b> {studentData.school}</p>
                  <p><b>Phone:</b> {studentData.phone}</p>
                </div>

                <button
                  onClick={confirmCheckin}
                  className="w-full bg-green-600 text-white py-3 rounded-xl font-medium"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Confirm Check-in"}
                </button>

                <button
                  onClick={resetScanner}
                  className="w-full mt-3 bg-gray-200 text-gray-700 py-3 rounded-xl"
                >
                  Cancel / Scan Again
                </button>
              </div>
            )}


            {/* SUCCESS / ERROR SCREEN */}
            {scanResult && scanResult !== 'preview' && (
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                {scanResult === 'success' ? (
                  <>
                    <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Check-In Successful!</h2>
                    <p className="mb-6">{studentData.name}</p>
                    <button onClick={resetScanner} className="w-full bg-indigo-600 text-white py-3 rounded-xl">
                      Scan Next
                    </button>
                  </>
                ) : (
                  <>
                    <XCircle className="w-20 h-20 text-red-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Check-In Failed</h2>
                    <button onClick={resetScanner} className="w-full bg-indigo-600 text-white py-3 rounded-xl">
                      Try Again
                    </button>
                  </>
                )}
              </div>
            )}

          </>
        )}


        {/* ---------------- CHECK-IN LIST TAB (unchanged) ---------------- */}
        {activeTab === 'checkins' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Total Checked In</div>
                <div className="text-4xl font-bold text-green-600">{stats.totalCheckedIn}</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Today Check-Ins</div>
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
                <button onClick={resetFilters} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Reset Filters
                </button>
                <button onClick={exportToExcel} className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export to Excel
                </button>
              </div>
            </div>

            {/* Table UI remains same */}
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