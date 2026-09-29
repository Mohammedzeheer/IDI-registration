"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Download, Filter, Users, CheckCircle, Clock, LogOut, Menu, X,
  Home, TrendingUp, Calendar, Scan, FileText, RefreshCw, Trash2
} from 'lucide-react';
import { DESIGNATIONS, SECTORS } from '../data/avanza';

const EMPTY_FILTERS = { search: '', designation: '', sector: '', unit: '', status: '' };

const fmtDateTime = d =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';

export default function AdminDashboard() {
  const [delegates, setDelegates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  useEffect(() => {
    fetchDelegates();
  }, []);

  const fetchDelegates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/avanza/checkin', { credentials: 'include' });
      const result = await response.json();
      if (result.success) setDelegates(result.delegates);
    } catch (error) {
      console.error('Error fetching delegates:', error);
    } finally {
      setLoading(false);
    }
  };

  const uniqueSorted = key =>
    [...new Set(delegates.map(d => d[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  // fixed list first, then any other values found in older entries
  const sectors = useMemo(
    () => [...SECTORS, ...uniqueSorted('sector').filter(s => !SECTORS.includes(s))],
    [delegates]
  );
  const units = useMemo(() => uniqueSorted('unit'), [delegates]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return delegates.filter(d =>
      (!filters.designation || d.designation === filters.designation) &&
      (!filters.sector || d.sector === filters.sector) &&
      (!filters.unit || d.unit === filters.unit) &&
      (!filters.status || (filters.status === 'in' ? d.checkedIn : !d.checkedIn)) &&
      (!q || [d.name, d.sector, d.unit, d.passId, d.phone, d.designation].some(v => v?.toLowerCase().includes(q)))
    );
  }, [delegates, filters]);

  const stats = useMemo(() => {
    const total = delegates.length;
    const checkedIn = delegates.filter(d => d.checkedIn).length;
    return {
      total,
      checkedIn,
      pending: total - checkedIn,
      rate: total ? Math.round((checkedIn / total) * 100) : 0,
      byDesignation: DESIGNATIONS.map(des => {
        const group = delegates.filter(d => d.designation === des);
        return { des, total: group.length, in: group.filter(d => d.checkedIn).length };
      })
    };
  }, [delegates]);

  const bySector = useMemo(() => {
    const map = {};
    SECTORS.forEach(s => { map[s] = { sector: s, total: 0, in: 0, byDes: {} }; });
    delegates.forEach(d => {
      const key = d.sector || '';
      map[key] ??= { sector: key, total: 0, in: 0, byDes: {} };
      map[key].total++;
      if (d.checkedIn) map[key].in++;
      map[key].byDes[d.designation] = (map[key].byDes[d.designation] || 0) + 1;
    });
    const order = s => (SECTORS.includes(s) ? SECTORS.indexOf(s) : s ? SECTORS.length : SECTORS.length + 1);
    return Object.values(map).sort((a, b) => order(a.sector) - order(b.sector));
  }, [delegates]);

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const exportRows = () =>
    filtered.map((d, i) => [
      i + 1,
      d.passId,
      d.name,
      d.sector,
      d.unit,
      d.designation,
      d.phone,
      d.checkedIn ? 'Checked in' : 'Not arrived',
      d.checkedIn ? fmtDateTime(d.checkedInAt) : '',
      fmtDateTime(d.createdAt)
    ]);
  const EXPORT_HEAD = ['#', 'Pass ID', 'Name', 'Sector', 'Unit', 'Designation', 'Mobile', 'Status', 'Checked in at', 'Registered'];
  const fileStamp = () => new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');

  const downloadCSV = (rows, filename) => {
    const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = rows.map(row => row.map(escape).join(',')).join('\r\n');
    // BOM so Excel opens UTF-8 (Malayalam names) correctly
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () =>
    downloadCSV([EXPORT_HEAD, ...exportRows()], `avanza_delegates_${filters.sector ? filters.sector + '_' : ''}${fileStamp()}.csv`);

  const exportSectorCSV = () => {
    const rows = bySector.map(s => [
      s.sector || 'Not specified',
      s.total,
      ...DESIGNATIONS.map(des => s.byDes[des] || 0),
      s.in,
      s.total - s.in,
      `${s.total ? Math.round((s.in / s.total) * 100) : 0}%`
    ]);
    rows.push(['TOTAL', stats.total, ...stats.byDesignation.map(d => d.total), stats.checkedIn, stats.pending, `${stats.rate}%`]);
    downloadCSV(
      [['Sector', 'Registered', ...DESIGNATIONS, 'Checked in', 'Not arrived', 'Attendance'], ...rows],
      `avanza_sector_summary_${fileStamp()}.csv`
    );
  };

  const exportToPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('Avanza – The Leaders Camp', 14, 15);
    doc.setFontSize(10);
    doc.text(
      `SSF Manjeshwar Division · ${filtered.length} delegates · Generated ${new Date().toLocaleString('en-IN')}`,
      14, 22
    );
    autoTable(doc, {
      startY: 27,
      head: [EXPORT_HEAD],
      body: exportRows(),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [31, 79, 209] }
    });
    doc.save(`avanza_delegates_${fileStamp()}.pdf`);
  };

  const handleDelete = async d => {
    if (!window.confirm(`Delete registration of ${d.name} (${d.passId})? This cannot be undone.`)) return;
    const res = await fetch(`/api/avanza/checkin?passId=${encodeURIComponent(d.passId)}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (res.ok) setDelegates(prev => prev.filter(x => x.passId !== d.passId));
    else alert('Delete failed');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/login', { method: 'DELETE' });
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const selectClass = 'px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1f4fd1] rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Avanza Admin</h1>
                <p className="text-xs text-gray-500">SSF Manjeshwar Division</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <a href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white bg-[#1f4fd1] rounded-lg">
              <Home className="w-5 h-5" />
              Dashboard
            </a>
            <a href="/admin/avanza" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Scan className="w-5 h-5" />
              Check-in Scanner
            </a>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Avanza Delegates</h2>
                  <p className="text-sm text-gray-600 hidden sm:block">The Leaders Camp · 01 Oct 2026 · Malhar Hifz Quran, Durgipalla</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-4">
            {[
              ['Registered', stats.total, 'All delegates', Users, 'border-blue-500', 'text-blue-500'],
              ['Checked in', stats.checkedIn, 'Arrived at venue', CheckCircle, 'border-green-500', 'text-green-500'],
              ['Not arrived', stats.pending, 'Yet to check in', Clock, 'border-orange-500', 'text-orange-500'],
              ['Attendance', `${stats.rate}%`, 'Checked in / registered', TrendingUp, 'border-purple-500', 'text-purple-500']
            ].map(([label, value, sub, Icon, border, color]) => (
              <div key={label} className={`bg-white rounded-xl shadow-sm p-4 lg:p-6 border-l-4 ${border}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-600">{label}</div>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="text-3xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500 mt-2">{sub}</div>
              </div>
            ))}
          </div>

          {/* By designation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {stats.byDesignation.map(({ des, total, in: arrived }) => (
              <button
                key={des}
                onClick={() => handleFilterChange('designation', filters.designation === des ? '' : des)}
                className={`bg-white rounded-xl shadow-sm px-4 py-3 text-left border-2 transition-colors ${
                  filters.designation === des ? 'border-[#1f4fd1]' : 'border-transparent hover:border-gray-200'
                }`}
              >
                <div className="text-sm font-medium text-gray-600">{des}</div>
                <div className="text-lg font-bold text-gray-900">
                  {arrived} <span className="text-sm font-normal text-gray-500">/ {total} checked in</span>
                </div>
              </button>
            ))}
          </div>

          {/* Sector-wise summary */}
          <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Sector-wise</h2>
                <p className="text-xs text-gray-500">Click a sector to filter the delegate list</p>
              </div>
              <div className="flex gap-2">
                {filters.sector && (
                  <button
                    onClick={() => handleFilterChange('sector', '')}
                    className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Show all sectors
                  </button>
                )}
                <button
                  onClick={exportSectorCSV}
                  disabled={!bySector.length}
                  className="px-3 py-1.5 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export summary
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Sector', 'Registered', ...DESIGNATIONS, 'Checked in', 'Not arrived', 'Attendance'].map(h => (
                      <th key={h} className="px-4 lg:px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bySector.length === 0 ? (
                    <tr>
                      <td colSpan={DESIGNATIONS.length + 5} className="px-6 py-6 text-center text-gray-500">No registrations yet</td>
                    </tr>
                  ) : bySector.map(s => {
                    const active = filters.sector === s.sector && s.sector;
                    const rate = s.total ? Math.round((s.in / s.total) * 100) : 0;
                    return (
                      <tr
                        key={s.sector || '__none'}
                        onClick={() => s.sector && handleFilterChange('sector', active ? '' : s.sector)}
                        className={`${s.sector ? 'cursor-pointer' : ''} ${active ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      >
                        <td className={`px-4 lg:px-6 py-3 whitespace-nowrap font-medium ${active ? 'text-[#1f4fd1]' : 'text-gray-900'}`}>
                          {s.sector || <span className="italic text-gray-400">Not specified</span>}
                        </td>
                        <td className="px-4 lg:px-6 py-3 font-semibold text-gray-900">{s.total}</td>
                        {DESIGNATIONS.map(des => (
                          <td key={des} className="px-4 lg:px-6 py-3 text-gray-700">{s.byDes[des] || 0}</td>
                        ))}
                        <td className="px-4 lg:px-6 py-3 text-green-700 font-medium">{s.in}</td>
                        <td className="px-4 lg:px-6 py-3 text-amber-600 font-medium">{s.total - s.in}</td>
                        <td className="px-4 lg:px-6 py-3">
                          <div className="flex items-center gap-2 min-w-[110px]">
                            <div className="h-2 flex-1 rounded-full bg-gray-100">
                              <div className="h-2 rounded-full bg-green-500" style={{ width: `${rate}%` }} />
                            </div>
                            <span className="text-xs text-gray-600 w-9 text-right">{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filters & Export</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Name, sector, unit, pass ID, mobile…"
                  value={filters.search}
                  onChange={e => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select value={filters.designation} onChange={e => handleFilterChange('designation', e.target.value)} className={selectClass}>
                <option value="">All Designations</option>
                {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={filters.sector} onChange={e => handleFilterChange('sector', e.target.value)} className={selectClass}>
                <option value="">All Sectors</option>
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filters.unit} onChange={e => handleFilterChange('unit', e.target.value)} className={selectClass}>
                <option value="">All Units</option>
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className={selectClass}>
                <option value="">All Status</option>
                <option value="in">Checked in</option>
                <option value="pending">Not arrived</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => setFilters(EMPTY_FILTERS)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Reset Filters
              </button>
              <button onClick={fetchDelegates} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                disabled={!filtered.length}
                className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Excel (CSV)
              </button>
              <button
                onClick={exportToPDF}
                disabled={!filtered.length}
                className="px-4 py-2 text-sm text-white bg-[#1f4fd1] rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Export PDF
              </button>
              <span className="text-sm text-gray-500">
                Exports the {filtered.length} delegate{filtered.length === 1 ? '' : 's'} shown below
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Pass ID', 'Name', 'Sector', 'Unit', 'Designation', 'Mobile', 'Status', 'Checked in', 'Registered', ''].map(h => (
                      <th key={h} className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="px-6 py-12 text-center text-gray-500">No delegates found</td>
                    </tr>
                  ) : (
                    filtered.map(d => (
                      <tr key={d.passId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-mono font-semibold text-[#1f4fd1]">{d.passId}</td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{d.name}</td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.sector || '-'}</td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.unit}</td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.designation}</td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.phone}</td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            d.checkedIn ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {d.checkedIn ? 'Checked in' : 'Not arrived'}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{d.checkedIn ? fmtDateTime(d.checkedInAt) : '-'}</td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fmtDateTime(d.createdAt)}</td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleDelete(d)}
                            aria-label={`Delete ${d.name}`}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!loading && filtered.length > 0 && (
              <div className="px-4 lg:px-6 py-3 border-t border-gray-200 text-sm text-gray-600">
                Showing <span className="font-medium">{filtered.length}</span> of <span className="font-medium">{delegates.length}</span> delegates
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
