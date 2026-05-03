import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Download, Image, MessageSquare, LogOut, IdCard } from "lucide-react";
import IDCard from "../../components/IDCard";
import Certificate from "../../components/Certificate";
import Gallery from "../../components/Gallery";
import FeedbackForm from "../../components/FeedbackForm";

export default function Dashboard() {
  const router = useRouter();
  const [student, setStudent] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("student");
    if (userData) {
      setStudent(JSON.parse(userData));
    } else {
      router.push("/student/login");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("student");
    router.push("/student/login");
  };

  if (!student) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center bg-blue-600 text-white px-6 py-4 shadow">
        <h1 className="text-xl font-semibold">Welcome, {student.name}</h1>
        <button onClick={handleLogout} className="flex items-center gap-2">
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>

      <div className="max-w-5xl mx-auto py-8 px-4 space-y-10">
        {/* ID Card */}
        <section className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <IdCard className="text-blue-600" />
            <h2 className="text-lg font-semibold">Your ID Card</h2>
          </div>
          <IDCard student={student} />
        </section>

        {/* Certificate */}
        <section className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Download className="text-green-600" />
            <h2 className="text-lg font-semibold">Certificate</h2>
          </div>
          <Certificate student={student} />
        </section>

        {/* Gallery */}
        <section className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Image className="text-yellow-600" />
            <h2 className="text-lg font-semibold">Program Gallery</h2>
          </div>
          <Gallery />
        </section>

        {/* Feedback */}
        <section className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="text-purple-600" />
            <h2 className="text-lg font-semibold">Feedback</h2>
          </div>
          <FeedbackForm student={student} />
        </section>
      </div>
    </div>
  );
}
