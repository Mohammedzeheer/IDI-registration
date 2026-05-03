'use client';

import React, { useState, useEffect } from 'react';
import { Download, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SubAdminDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [division, setDivision] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const stored = localStorage.getItem('sub_admin');

    if (!stored) {
      router.push('/division/login');
      return;
    }

    let div;
    try {
      const parsed = JSON.parse(stored);
      div = parsed.division;
    } catch {
      div = stored.replace(/"/g, '');
    }

    setDivision(div);
    fetchStudents(div);
  }, [router]);

  const fetchStudents = async (div) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/division/student?division=${div}`);
      const result = await response.json();
      if (result.success) setStudents(result.data.students);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = students.length;
  const totalPages = Math.ceil(totalStudents / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentStudents = students.slice(indexOfFirst, indexOfLast);

  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'place', 'Phone','Division', 'Class', 'School'];
    const csvData = students.map(s => [
      s.festId || '-', s.name, s.place || '', s.phone, s.division, s.class, s.school
    ]);
    const csv = [headers, ...csvData].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${division}_students.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {division} Division - Students ({totalStudents})
          </h1>
          <button
            onClick={() => {
              localStorage.removeItem('sub_admin');
              router.push('/division/login');
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            Logout
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Students List</h2>
          </div>

          <button
            onClick={exportToCSV}
            className="px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600"> ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Place</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Phone</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Class</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">School</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-10">Loading...</td></tr>
              ) : currentStudents.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-10 text-gray-500">No data</td></tr>
              ) : (
                currentStudents.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{s.festId}</td>
                    <td className="px-4 py-3 text-sm">{s.name}</td>
                    <td className="px-4 py-3 text-sm">{s?.place}</td>
                    <td className="px-4 py-3 text-sm">{s.phone}</td>
                    <td className="px-4 py-3 text-sm">{s.class}</td>
                    <td className="px-4 py-3 text-sm">{s.school}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 px-2">
          <p className="text-sm text-gray-600">
            Showing {indexOfFirst + 1} - {Math.min(indexOfLast, totalStudents)} of {totalStudents}
          </p>

          <div className="flex items-center gap-3">
            <button onClick={handlePrev} disabled={currentPage === 1} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Previous</button>
            <span className="text-sm">Page {currentPage} of {totalPages}</span>
            <button onClick={handleNext} disabled={currentPage === totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Next</button>
          </div>
        </div>

      </div>
    </div>
  );
}



// 'use client';

// import React, { useState, useEffect } from 'react';
// import { Search, Download, Filter } from 'lucide-react';
// import { useRouter } from 'next/navigation';

// export default function SubAdminDashboard() {
//   const router = useRouter();
//   const [students, setStudents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [division, setDivision] = useState('');


//   useEffect(() => {
//   const stored = localStorage.getItem('sub_admin');

//   if (!stored) {
//     router.push('/division/login');
//     return;
//   }

//   let div;
//   try {
//     const parsed = JSON.parse(stored);
//     div = parsed.division; // if object
//   } catch {
//     div = stored.replace(/"/g, ''); // if plain string
//   }

//   setDivision(div);
//   fetchStudents(div);
// }, [router]);


//   const fetchStudents = async (div) => {
//     setLoading(true);
//     try {
//       const response = await fetch(`/api/division/student?division=${div}`);
//       console.log(response)
//       const result = await response.json();
//       if (result.success) {
//         setStudents(result.data.students);
//       }
//     } catch (error) {
//       console.error('Error fetching students:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const exportToCSV = () => {
//     const headers = ['Fest ID', 'Name', 'Phone', 'Class', 'School', 'Division'];
//     const csvData = students.map(s => [
//       s.festId || '-', s.name, s.phone, s.class, s.school, s.division
//     ]);
//     const csv = [headers, ...csvData].map(r => r.join(',')).join('\n');
//     const blob = new Blob([csv], { type: 'text/csv' });
//     const a = document.createElement('a');
//     a.href = URL.createObjectURL(blob);
//     a.download = `${division}_students.csv`;
//     a.click();
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-6xl mx-auto">
//         <div className="flex items-center justify-between mb-6">
//           <h1 className="text-2xl font-bold text-gray-900">
//             {division} Division - Students
//           </h1>
//           <button
//             onClick={() => {
//               localStorage.removeItem('sub_admin');
//               router.push('/division/login');
//             }}
//             className="text-sm text-blue-600 hover:underline"
//           >
//             Logout
//           </button>
//         </div>

//         <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center gap-2">
//               <Filter className="w-4 h-4 text-gray-600" />
//               <h2 className="text-lg font-semibold text-gray-900">Students List</h2>
//             </div>
//             <button
//               onClick={exportToCSV}
//               className="px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
//             >
//               <Download className="w-4 h-4" />
//               Export CSV
//             </button>
//           </div>
//         </div>

//         <div className="bg-white rounded-lg shadow overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Fest ID</th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Phone</th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Class</th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">School</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200">
//               {loading ? (
//                 <tr><td colSpan="5" className="text-center py-10">Loading...</td></tr>
//               ) : students.length === 0 ? (
//                 <tr><td colSpan="5" className="text-center py-10 text-gray-500">No students found</td></tr>
//               ) : (
//                 students.map((s) => (
//                   <tr key={s._id} className="hover:bg-gray-50">
//                     <td className="px-4 py-3 text-sm">{s.festId}</td>
//                     <td className="px-4 py-3 text-sm">{s.name}</td>
//                     <td className="px-4 py-3 text-sm">{s.phone}</td>
//                     <td className="px-4 py-3 text-sm">{s.class}</td>
//                     <td className="px-4 py-3 text-sm">{s.school}</td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }
