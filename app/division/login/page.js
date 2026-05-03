'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';

const divisions = [
  { name: 'Manjeshwar', password: 'man123' },
  { name: 'Uppala', password: 'uppala123' },
  { name: 'Kumbala', password: 'kumbala123' },
  { name: 'Badiyadka', password: 'badi123' },
  { name: 'Mulleriya', password: 'mull123' },
  { name: 'Kasaragod', password: 'kas123' },
  { name: 'Kanhangad', password: 'kana123' },
  { name: 'Uduma', password: 'uduma123' },
  { name: 'Trikaripur', password: 'trika123' },
];

export default function SubAdminLogin() {
  const router = useRouter();
  const [division, setDivision] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);


  const handleLogin = (e) => {
    e.preventDefault();

    const match = divisions.find((d) => d.name === division);

    if (match && match.password === password) {
      localStorage.setItem('sub_admin', match.name);
      router.push('/division/student');
    } else {
      setError('Invalid division or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-full mb-3">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Division Login</h1>
          <p className="text-gray-500 text-sm">Sub Admin Access</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Division Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Division
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-lg py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Division</option>
                {divisions.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter division password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-2.5 px-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>


          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-all"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}



// 'use client';
// import React, { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { Lock, User, AlertCircle } from 'lucide-react';

// const divisions = [
//   'Manjeshwar', 'Uppala', 'Kumbala', 'Badiyadka', 'Mulleriya', 'Kasaragod', 'Kanarangad', 'Uduma', 'Trikaripur'
// ];

// export default function SubAdminLogin() {
//   const router = useRouter();
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');

//   const handleLogin = (e) => {
//     e.preventDefault();

//     const match = divisions.find(
//       (div) => div.toLowerCase() === username.trim().toLowerCase()
//     );

//     if (match && password === '12345') {
//       localStorage.setItem('sub_admin', match);
//       router.push('/division/student');
//     } else {
//       setError('Invalid username or password');
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-6">
//       <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
//         <div className="text-center mb-6">
//           <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-full mb-3">
//             <Lock className="w-7 h-7 text-white" />
//           </div>
//           <h1 className="text-2xl font-bold text-gray-800">Division Login</h1>
//           <p className="text-gray-500 text-sm">Sub Admin Access</p>
//         </div>

//         {error && (
//           <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
//             <AlertCircle className="w-5 h-5" />
//             {error}
//           </div>
//         )}

//         <form onSubmit={handleLogin} className="space-y-5">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Division Name
//             </label>
//             <div className="relative">
//               <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
//               <input
//                 type="text"
//                 placeholder="Enter division (e.g. Manjeshwar)"
//                 value={username}
//                 onChange={(e) => setUsername(e.target.value)}
//                 className="pl-10 w-full border border-gray-300 rounded-lg py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 required
//               />
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Password
//             </label>
//             <input
//               type="password"
//               placeholder="Enter password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               required
//             />
//           </div>

//           <button
//             type="submit"
//             className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-all"
//           >
//             Login
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }
