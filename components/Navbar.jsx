"use client";
import { useEffect, useState, useRef, useContext } from 'react';
import { IoClose, IoReorderThree } from "react-icons/io5";
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Link, useLocation } from 'react-router-dom';
import Image from 'next/image';
import EventLogo from '../public/EventLogo.png';

function Navbar() {
  const [open, setOpen] = useState(false);
  const [gradientScroll, setGradientScroll] = useState(true);
  const navRef = useRef();

  // Check if we're in a Router context
  let hasRouter = true;
  try {
    useLocation();
  } catch {
    hasRouter = false;
  }

  useEffect(() => {
    AOS.init();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleScroll = () => {
      setOpen(false);
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleScroll);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll);
    };
  }, [open]);

  useEffect(() => {
    const handleScrollChange = () => {
      const scrollPosition = window.scrollY;
      setGradientScroll(scrollPosition <= 550);
    };

    window.addEventListener('scroll', handleScrollChange);
    return () => {
      window.removeEventListener('scroll', handleScrollChange);
    };
  }, []);

  // Navigation component that switches between Link and anchor tags
  const NavLink = ({ to, children, className }) => {
    return hasRouter ? (
      <Link to={to} className={className}>{children}</Link>
    ) : (
      <a href={to} className={className}>{children}</a>
    );
  };

  return (
    <div
      ref={navRef}
      // className={`fixed w-full flex items-center z-40 justify-between p-4 px-12 lg:px-36 md:px-24 duration-150 ease-in ${gradientScroll ? 'bg-gradient-to-b from-transparent to-transparent text-white' : 'bg-white shadow-sm'}`}
      className={`fixed w-full flex items-center z-40 justify-between p-4 px-12 lg:px-36 md:px-24 duration-150 ease-in 
  ${gradientScroll ? 'lg:bg-white bg-gradient-to-b from-transparent to-transparent text-primary' : 'bg-white shadow-sm text-black'}`}

    >
      {/* Logo */}
      <div className='flex gap-3 items-center'>
        <Image priority src={EventLogo} className='w-14 h-auto' alt="" />
      </div>
      {/* Desktop Nav */}
      <div className="lg:flex gap-5 hidden poppins-medium">
        <NavLink to="/" className={`hover-underline-animation hover:scale-110 duration-150 transition-all ${gradientScroll ? 'after:bg-white' : 'after:bg-primary'}`}>Home</NavLink>
      </div>

      <a href={"https://chat.whatsapp.com/FRZb464Auv7IQsu4sRIM5Z?mode=wwt"} className={`rounded text-white poppins-bold text-xs p-1.5 px-3 lg:block hidden ${gradientScroll ? 'bg-primary border border-white hover:text-white hover:bg-primary hover:border-0' : 'text-white bg-primary'}`}>
        Join Us
      </a>

      {/* Mobile Nav */}
      <div className="block lg:hidden z-40">
        {!open ? (
          <IoReorderThree
            onClick={() => setOpen(true)}
            size={40}
            className={` transition-all duration-200 ${gradientScroll ? 'text-white' : 'text-primary'}`}
          />
        ) : (
          <IoClose
            onClick={() => setOpen(false)}
            size={40}
            className="text-primary transition-all duration-200 z-50 relative"
          />
        )}

        {open && (
          <div
            className="fixed top-0 right-0 h-1/3 w-full lg:w-8/12 backdrop-blur-[100px] bg-secondary shadow-2xl z-40 flex flex-col gap-3 poppins-semibold text-lg p-6 pt-14 overflow-y-auto animate-slide-in"
            data-aos="fade-down"
          >
            <NavLink to="/" className="text-primary hover:text-[#9E2A2B] transition-all">Home</NavLink>
          </div>
        )}
      </div>
    </div>
  );
}

export default Navbar;



