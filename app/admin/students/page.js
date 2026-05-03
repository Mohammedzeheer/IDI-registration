'use client'

import React, { useState, useEffect } from 'react';
import { Search, Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
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
    totalStudents: 0,
    completedProfiles: 0,
    incompleteProfiles: 0
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 50
  });

  useEffect(() => {
    fetchStudents();
  }, [filters, pagination.currentPage]);

  const fetchStudents = async () => {
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

      const response = await fetch(`/api/admin/students?${params}`);
      const result = await response.json();

      if (result.success) {
        setStudents(result.data.students);
        setPagination(result.data.pagination);
        setFilterOptions(result.data.filters);
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, search: value }));
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

  const exportToCSV = async () => {
  try {
    // Build filter query without pagination
    const params = new URLSearchParams({
      ...(filters.school && { school: filters.school }),
      ...(filters.class && { class: filters.class }),
      ...(filters.division && { division: filters.division }),
      ...(filters.search && { search: filters.search })
    });

    // Fetch ALL students (backend should return all data when limit=0)
    const res = await fetch(`/api/admin/students?limit=0&${params.toString()}`);
    const result = await res.json();

    if (!result.success) return alert("Export failed");

    const allStudents = result.data.students;

    const headers = ['Fest ID', 'Name', 'Place', 'Phone', 'Class', 'Division', 'DOB', 'Profile Status', 'Registered At', 'School'];
    const csvData = allStudents.map(student => [
      student.festId || 'N/A',
      student.name || 'N/A',
      student.place || 'N/A',
      student.phone,
      student.class || 'N/A',
      student.division || 'N/A',
      new Date(student.dob).toLocaleDateString(),
      student.profileCompleted ? 'Completed' : 'Incomplete',
      new Date(student.registeredAt).toLocaleDateString(),
      student.school || 'N/A',
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_all_${new Date().toISOString()}.csv`;
    a.click();
  } catch (error) {
    console.error('Export CSV Error:', error);
  }
};


  const exportToCSV1 = () => {
    const headers = ['Fest ID', 'Name', 'Place', 'Phone', 'Class', 'Division', 'DOB', 'Profile Status', 'Registered At', 'School'];
    const csvData = students.map(student => [
      student.festId || 'N/A',
      student.name || 'N/A',
      student.place || 'N/A',
      student.phone,
      student.class || 'N/A',
      student.division || 'N/A',
      new Date(student.dob).toLocaleDateString(),
      student.profileCompleted ? 'Completed' : 'Incomplete',
      new Date(student.registeredAt).toLocaleDateString(),
      student.school || 'N/A',
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search name, phone, ID..."
                value={filters.search}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* School Filter */}
            <select
              value={filters.school}
              onChange={(e) => handleFilterChange('school', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Schools</option>
              {filterOptions.schools.map(school => (
                <option key={school} value={school}>{school}</option>
              ))}
            </select>

            {/* Class Filter */}
            <select
              value={filters.class}
              onChange={(e) => handleFilterChange('class', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Classes</option>
              {filterOptions.classes.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>

            {/* Division Filter */}
            <select
              value={filters.division}
              onChange={(e) => handleFilterChange('division', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              onClick={exportToCSV}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fest ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Place</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Division</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      No students found
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.festId || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.place || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.class || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {student.school || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.division || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${student.profileCompleted
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {student.profileCompleted ? 'Completed' : 'Incomplete'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(student.dob).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(student.registeredAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && students.length > 0 && (
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
                              ? 'bg-blue-600 text-white'
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
      </div>
    </div>
  );
}