
'use client';
import { useState } from 'react';
import React from 'react';
import { useRouter } from "next/navigation";
import { X, Download, Menu, Calendar, Users, Trophy, Sparkles, BookOpen } from 'lucide-react';
import schools from '../data/school';
import divisions from '../data/division';
import toast from 'react-hot-toast';
import Image from "next/image";

const DATA = {
  classes: ['6th', '7th', '8th', '9th', 'SSLC', '+1', '+2', 'Degree']
};

const API = {
  register: async (phone, dob) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, dob })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  completeProfile: async (studentId, profileData) => {
    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: studentId, ...profileData })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Profile completion failed');
      }

      return data;
    } catch (error) {
      console.error('Profile completion error:', error);
      throw error;
    }
  },

  login: async (phone, dob) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, dob })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
};

// QR Code generator
const generateQRCode = (data) => {
  const qrData = encodeURIComponent(JSON.stringify(data));
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrData}`;
};

export default function StudentGala() {
  const [currentPage, setCurrentPage] = useState('home');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [mode, setMode] = useState('register');
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showQRPopup, setShowQRPopup] = useState(false);
  const [showwhatsappPopup, setShowwhatsappPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Registration state
  const [regPhone, setRegPhone] = useState('');
  const [regDob, setRegDob] = useState('');
  const [studentId, setStudentId] = useState(null);
  // Profile state
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [division, setDivision] = useState('');
  const [school, setSchool] = useState('');
  const [classValue, setClassValue] = useState('');
  // Login state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginDob, setLoginDob] = useState('');
  // Student data and QR
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [studentData, setStudentData] = useState(null);
  // School search
  const [schoolSearch, setSchoolSearch] = useState('');
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const router = useRouter();

  const filteredSchools = schools.filter(sch =>
    sch.toLowerCase().includes(schoolSearch.toLowerCase())
  );

  // Check for existing session on component mount
  React.useEffect(() => {
    const savedStudentData = localStorage.getItem('studentData');
    const savedIsLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (savedStudentData && savedIsLoggedIn === 'true') {
      try {
        const parsedData = JSON.parse(savedStudentData);
        setStudentData(parsedData);
        setIsLoggedIn(true);
        
        // Generate QR code URL
        const qrUrl = generateQRCode(parsedData);
        setQrCodeUrl(qrUrl);
        
        setCurrentPage('dashboard');
      } catch (error) {
        console.error('Error restoring session:', error);
        // Clear invalid data
        localStorage.removeItem('studentData');
        localStorage.removeItem('isLoggedIn');
      }
    }
    setIsInitialized(true);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regPhone && regDob) {
      setLoading(true);
      try {
        const result = await API.register(regPhone, regDob);

        if (result.success) {
          setStudentId(result.studentId);
          setShowProfilePopup(true);
        } else {
          toast(result.message || 'Registration failed');
        }
      } catch (error) {
        toast(error.message || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (name && school && classValue) {
      setLoading(true);
      try {
        const profileData = {
          name,
          place,
          // division,
          school,
          class: classValue
        };

        const result = await API.completeProfile(studentId, profileData);

        if (result.success) {
          const completeStudentData = result.student;
          setStudentData(completeStudentData);

          const qrUrl = generateQRCode(completeStudentData);
          setQrCodeUrl(qrUrl);

          setShowProfilePopup(false);
          setShowQRPopup(true);

          setRegPhone('');
          setRegDob('');
          setName('');
          setPlace('');
          // setDivision('');
          setSchool('');
          setSchoolSearch('');
          setClassValue('');

          toast(`Registration complete! Your ID is: ${completeStudentData.festId}`);
        } else {
          toast(result.message || 'Profile completion failed');
        }
      } catch (error) {
        toast(error.message || 'Profile completion failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loginPhone && loginDob) {
      setLoading(true);
      try {
        const result = await API.login(loginPhone, loginDob);

        if (result.success) {
          const loggedInStudent = result.student;

          if (loggedInStudent.profileCompleted) {
            toast(`Welcome back, ${loggedInStudent.name}!`);
            setStudentData(loggedInStudent);
            
            // Save to localStorage for persistent login
            localStorage.setItem('studentData', JSON.stringify(loggedInStudent));
            localStorage.setItem('isLoggedIn', 'true');
            
            const qrUrl = generateQRCode(loggedInStudent);
            setQrCodeUrl(qrUrl);
            setIsLoggedIn(true);
            setCurrentPage('dashboard');
          } else {
            toast('Please complete your profile to get your ID');
            setStudentId(loggedInStudent.studentId);
            setRegPhone(loginPhone);
            setRegDob(loginDob);
            setShowProfilePopup(true);
          }
        } else {
          toast(result.message || 'Login failed');
        }
      } catch (error) {
        toast(error.message || 'Login failed. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    }
  };


  const downloadQRCode = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 1200);
    gradient.addColorStop(0, '#4F46E5');
    gradient.addColorStop(1, '#7C3AED');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 1200);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 800, 800, 400);

    // Helper function to wrap text
    const wrapText = (text, x, y, maxWidth, lineHeight) => {
      const words = text.split(' ');
      let line = '';
      let lineCount = 0;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line.trim(), x, y);
          line = words[n] + ' ';
          y += lineHeight;
          lineCount++;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), x, y);
      lineCount++;

      return lineCount;
    };

    const drawRestOfCard = () => {
      // Student name with text wrapping
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'left';
      ctx.font = 'bold 45px Arial';
      ctx.textBaseline = 'alphabetic';

      const nameLines = wrapText(studentData.name, 60, 900, 450, 65);

      // Festival ID badge
      const text = studentData.festId;
      const fontSize = 32;
      ctx.font = `bold ${fontSize}px Arial`;
      const textMetrics = ctx.measureText(text);
      const paddingX = 30;
      const paddingY = 10;
      const textWidth = textMetrics.width + paddingX * 2;
      const textHeight = fontSize + paddingY * 2;

      const x = 60;
      const badgeY = 900 + (nameLines * 65) + 20;
      const radius = textHeight / 2;

      // Draw smooth pill-shaped background
      ctx.beginPath();
      ctx.moveTo(x + radius, badgeY - textHeight);
      ctx.lineTo(x + textWidth - radius, badgeY - textHeight);
      ctx.quadraticCurveTo(x + textWidth, badgeY - textHeight, x + textWidth, badgeY - textHeight + radius);
      ctx.lineTo(x + textWidth, badgeY - radius);
      ctx.quadraticCurveTo(x + textWidth, badgeY, x + textWidth - radius, badgeY);
      ctx.lineTo(x + radius, badgeY);
      ctx.quadraticCurveTo(x, badgeY, x, badgeY - radius);
      ctx.lineTo(x, badgeY - textHeight + radius);
      ctx.quadraticCurveTo(x, badgeY - textHeight, x + radius, badgeY - textHeight);
      ctx.closePath();

      ctx.fillStyle = '#4F46E5';
      ctx.fill();
      ctx.strokeStyle = '#4F46E5';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw white text centered inside badge
      ctx.fillStyle = 'white';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x + paddingX, badgeY - textHeight / 2);

      // Class info
      ctx.fillStyle = '#1F2937';
      ctx.font = '32px Arial';
      ctx.textBaseline = 'alphabetic';
      const classY = badgeY + 50;
      // ctx.fillText(`Class: ${studentData.class} - ${studentData.division}`, 60, classY);
      ctx.fillText(`Class: ${studentData.class}`, 60, classY);

      // School name with wrapping
      ctx.font = '24px Arial';
      ctx.fillStyle = '#4B5563';
      wrapText(studentData.school, 60, classY + 50, 450, 32);

      // QR Code
      const qrImage = new window.Image();
      qrImage.crossOrigin = 'anonymous';
      qrImage.onload = () => {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(520, 860, 240, 240);
        ctx.drawImage(qrImage, 530, 870, 220, 220);

        ctx.strokeStyle = '#4F46E5';
        ctx.lineWidth = 8;
        ctx.strokeRect(0, 0, 800, 1200);

        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Id-card-${studentData?.festId || 'student'}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        });
      };
      qrImage.src = qrCodeUrl;
    };

    const logo = new window.Image();
    logo.crossOrigin = 'anonymous';
    logo.onload = () => {
      // const logoWidth = 700;
      // const logoHeight = 700;
      // const logoX = (canvas.width - logoWidth) / 2;
      // const logoY = 50;
      // ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
      const logoWidth = canvas.width;   // full width
      const logoHeight = 800;           // adjust as needed
      const logoX = 0;                  // no padding
      const logoY = 0;
      ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

      drawRestOfCard();
    };
    logo.onerror = () => {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 72px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('IDI', 400, 320);
      drawRestOfCard();
    };
    logo.src = '/galanew.png';
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* {!isInitialized ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      ) : ( */}
      <>
      {/* Navbar */}
      <nav className="bg-white shadow-lg fixed w-full top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
               IDI
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => setCurrentPage('home')}
                className={`font-medium transition-colors ${currentPage === 'home' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
                  }`}
              >
                Home
              </button>
              {!isLoggedIn ? (
                <>
                  <button
                    onClick={() => setCurrentPage('register')}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-full font-medium hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg"
                  >
                    Register Now
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPage('register');
                      setMode('login');
                    }}
                    className="text-gray-600 hover:text-indigo-600 font-medium transition-colors"
                  >
                    Login
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setCurrentPage('dashboard')}
                    className={`font-medium transition-colors ${currentPage === 'dashboard' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
                      }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setIsLoggedIn(false);
                      setStudentData(null);
                      setCurrentPage('home');
                      
                      // Clear localStorage
                      localStorage.removeItem('studentData');
                      localStorage.removeItem('isLoggedIn');
                      
                      toast('Logged out successfully');
                    }}
                    className="text-gray-600 hover:text-red-600 font-medium transition-colors"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden text-gray-600 hover:text-indigo-600"
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden py-4 space-y-3 border-t">
              <button
                onClick={() => {
                  setCurrentPage('home');
                  setShowMobileMenu(false);
                }}
                className="block w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 rounded-lg"
              >
                Home
              </button>
              {!isLoggedIn ? (
                <>
                  <button
                    onClick={() => {
                      setCurrentPage('register');
                      setShowMobileMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Register Now
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPage('register');
                      setMode('login');
                      setShowMobileMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 rounded-lg"
                  >
                    Login
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setCurrentPage('dashboard');
                      setShowMobileMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 rounded-lg"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setIsLoggedIn(false);
                      setStudentData(null);
                      setCurrentPage('home');
                      setShowMobileMenu(false);
                      
                      // Clear localStorage
                      localStorage.removeItem('studentData');
                      localStorage.removeItem('isLoggedIn');
                      
                      toast('Logged out successfully');
                    }}
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-16">
        {currentPage === 'home' ? (
          /* Home Page */
          <div>
            {/* Hero Section */}
            <div className="relative flex items-center justify-center overflow-hidden py-10">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=80')",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 to-purple-900/90"></div>
              </div>

              <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                {/* <Image
                  src="/galawhite4.png"
                  alt="Gala Logo"
                  width={800}
                  height={200}
                  className="mx-auto w-full max-w-[800px] h-auto"
                  priority
                /> */}

                  <h1 className="text-3xl sm:text-5xl font-bold text-gray-100 mb-6">
                    IDI Career Guidance Programme
                  </h1>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button
                    onClick={() => setCurrentPage('register')}
                    className="bg-gradient-to-r from-yellow-400 to-pink-500 text-white px-8 py-4 rounded-full text-lg font-bold hover:shadow-2xl transition-all transform hover:scale-105 w-full sm:w-auto"
                  >
                    Register Now
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPage('register');
                      setMode('login');
                    }}
                    className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-white/30 transition-all border-2 border-white/50 w-full sm:w-auto"
                  >
                    Login
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-16 max-w-3xl mx-auto">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20">
                    <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400 mx-auto mb-2" />
                    {/* <div className="text-2xl sm:text-3xl font-bold text-white">1 Day</div> */}
                    <div className="text-xs sm:text-sm text-gray-300">Career</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20">
                    <Users className="w-8 h-8 sm:w-10 sm:h-10 text-pink-400 mx-auto mb-2" />
                    {/* <div className="text-2xl sm:text-3xl font-bold text-white">1000+</div> */}
                    <div className="text-xs sm:text-sm text-gray-300">Students</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20">
                    <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-green-400 mx-auto mb-2" />
                    {/* <div className="text-2xl sm:text-3xl font-bold text-white">10+</div> */}
                    <div className="text-xs sm:text-sm text-gray-300">Sessions</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
                  <div className="w-1 h-3 bg-white rounded-full mt-2"></div>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="py-16 sm:py-20 px-4 bg-white">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-800">
                  Why Join?
                </h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center p-6 rounded-2xl hover:shadow-xl transition-all transform hover:-translate-y-2 bg-gradient-to-br from-purple-50 to-pink-50">
                    <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-800">Network & Connect</h3>
                    <p className="text-gray-600">Meet talented students from different schools and divisions</p>
                  </div>
                  <div className="text-center p-6 rounded-2xl hover:shadow-xl transition-all transform hover:-translate-y-2 bg-gradient-to-br from-yellow-50 to-orange-50">
                    <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-800">Showcase Skills</h3>
                    <p className="text-gray-600">Platform to showcase your talents and abilities</p>
                  </div>
                  <div className="text-center p-6 rounded-2xl hover:shadow-xl transition-all transform hover:-translate-y-2 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-800">Amazing Prizes</h3>
                    <p className="text-gray-600">Win exciting prizes and certificates in various competitions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : currentPage === 'dashboard' ? (
          /* Dashboard Page */
          <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 py-20 px-4">
            <div className="max-w-4xl mx-auto">
              {/* Welcome Header */}
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                  Welcome, {studentData?.name}! 🎉
                </h1>
                <p className="text-gray-600">Your ID: <span className="font-bold text-indigo-600">{studentData?.festId}</span></p>
              </div>

              {/* Profile Card */}
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Users className="w-6 h-6 text-indigo-600" />
                  Your Profile
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Full Name</p>
                      <p className="text-lg font-semibold text-gray-800">{studentData?.name}</p>
                    </div>
                    {studentData?.place && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Place</p>
                        <p className="text-lg font-semibold text-gray-800">{studentData.place}</p>
                      </div>
                    )}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Class</p>
                      <p className="text-lg font-semibold text-gray-800">{studentData?.class}</p>
                    </div>
                  </div>
                  {/* <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Division</p>
                      <p className="text-lg font-semibold text-gray-800">{studentData?.division}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                      <p className="text-lg font-semibold text-gray-800">{studentData?.phone}</p>
                    </div>
                  </div> */}
                  <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">School</p>
                    <p className="text-lg font-semibold text-gray-800">{studentData?.school}</p>
                  </div>
                </div>
              </div>

              {/* Action Cards */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* QR Code Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-3">Your ID Card</h3>
                    <p className="text-gray-600 mb-4 text-sm">Download your personalized ID card with QR code</p>
                    <button
                      onClick={downloadQRCode}
                      className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      <Download size={20} />
                      Download ID Card
                    </button>
                  </div>
                </div>

                {/* WhatsApp Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-3">Join WhatsApp Group</h3>
                    <p className="text-gray-600 mb-4 text-sm">Stay updated with all announcements and event details</p>
                    <a
                      href="https://chat.whatsapp.com/FRZb464Auv7IQsu4sRIM5Z"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-block bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors shadow-lg hover:shadow-xl"
                    >
                      Join Group
                    </a>
                  </div>
                </div>
              </div>

              {/* Feedback Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
                <div className="text-center mb-6 gap-2">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 22c5.421 0 10-4.579 10-10S17.421 2 12 2 2 6.579 2 12s4.579 10 10 10zm-1-7h2v2h-2v-2zm0-8h2v6h-2V7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3"> Feedback</h3>

                  {(() => {
                    const now = new Date();
                    const openTime = new Date("2026-5-6T17:00:00+05:30"); // 22 Nov, 5 PM IST

                    if (now >= openTime) {
                      return (
                        <button
                          onClick={() => router.push(`/feedback?festId=${studentData.festId}`)}
                          className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
                        >
                          Give Feedback
                        </button>

                      );
                    } else {
                      return (
                        <p className="text-gray-500 text-sm">
                           Feedback form will be available after May 6, 2026
                        </p>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Certificate Section */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  Certificates & Achievements
                </h2>
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
                  <Trophy className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Coming Soon!</h3>
                  <p className="text-gray-600 mb-4">
                    Your participation certificates and achievement awards will be available here after the event.
                  </p>
                  <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
                    <Calendar className="w-4 h-4" />
                    Event Date: May 6, 2026
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* Registration Page */
          <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-500 animate-[gradient-move_10s_ease_infinite] flex items-center justify-center p-4 py-20">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
              {/* Mode Toggle */}
              <div className="flex gap-2 mb-8 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setMode('register')}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${mode === 'register'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Register
                </button>
                <button
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${mode === 'login'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Login
                </button>
              </div>

              {/* Register Form */}
              {mode === 'register' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Student Registration</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="Enter 10-digit phone number"
                      maxLength="10"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={regDob}
                      onChange={(e) => setRegDob(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      required
                      disabled={loading}
                    />
                  </div>

                  <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Register'}
                  </button>
                </div>
              )}

              {/* Login Form */}
              {mode === 'login' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Welcome Back</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      maxLength="10"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={loginDob}
                      onChange={(e) => setLoginDob(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      required
                      disabled={loading}
                    />
                  </div>

                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Login'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Profile Completion Popup */}
      {showProfilePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowProfilePopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
              disabled={loading}
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-6">Complete Your Profile</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Place *
                </label>
                <input
                  type="text"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  placeholder="Enter your Native Place"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  required
                  disabled={loading}
                />
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Division *
                </label>
                <select
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white"
                  required
                  disabled={loading}
                >
                  <option value="">Select Division</option>
                  {divisions.map((div) => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                </select>
              </div> */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={schoolSearch}
                    onChange={(e) => {
                      setSchoolSearch(e.target.value);
                      setSchool(e.target.value);
                      setShowSchoolDropdown(true);
                    }}
                    onFocus={() => setShowSchoolDropdown(true)}
                    placeholder="Type to search school..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white"
                    required
                    disabled={loading}
                  />

                  {/* Dropdown */}
                  {showSchoolDropdown && filteredSchools.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredSchools.map((sch, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setSchool(sch);
                            setSchoolSearch(sch);
                            setShowSchoolDropdown(false);
                          }}
                          className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-gray-800 border-b border-gray-100 last:border-b-0"
                        >
                          {sch}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Click outside to close dropdown */}
                {showSchoolDropdown && (
                  <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShowSchoolDropdown(false)}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class *
                </label>
                <select
                  value={classValue}
                  onChange={(e) => setClassValue(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white"
                  required
                  disabled={loading}
                >
                  <option value="">Select Class</option>
                  {DATA.classes.map((cls) => (
                    <option key={cls} value={cls}>Class {cls}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleProfileSubmit}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Complete Registration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Popup */}
      {showQRPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            <button
              onClick={() => setShowQRPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={24} />
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Complete!</h2>
              <p className="text-gray-600 mb-4">Your unique QR code has been generated</p>

              {/* WhatsApp Group Join Button */}
              <a
                href="https://chat.whatsapp.com/FRZb464Auv7IQsu4sRIM5Z"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors shadow-lg hover:shadow-xl mb-6"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Join  WhatsApp Group
              </a>

              <div className="bg-gray-50 p-6 rounded-xl mb-6">
                <img
                  src={qrCodeUrl}
                  alt="Student QR Code"
                  className="w-48 h-48 mx-auto mb-4 rounded-lg shadow-md"
                />
              </div>

              <button
                onClick={downloadQRCode}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download ID Card
              </button>
            </div>
          </div>
        </div>
      )}
      </>
    </div>
  );
}