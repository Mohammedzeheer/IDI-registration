import Image from 'next/image';
import { RiInstagramFill } from 'react-icons/ri';
import { FaYoutube, FaFacebookSquare } from 'react-icons/fa';
import fontImage from '../public/fontssf.png';

function Footer() {
  return (
    <div className='bg-primary p-6 px-12 lg:px-36 md:px-24 pt-6 pb-10 shadow-[0_35px_60px_5px_rgba(0,0,0,0.3)] w-full z-50'>
      {/* Main footer content */}
      <div className='flex justify-between items-center mb-4'>
        <div>
          <div className='w-11 relative'> 
            <Image
              src={fontImage}
              alt='ssf'
              className='filter brightness-0 invert w-full h-auto'
              priority={false}
            />
          </div>
          <h1 className='font-extrabold text-base md:text-lg uppercase text-white'>MANJESHWAR DIVISION</h1>
        </div>
        <div className='flex gap-1 items-center text-white'>
          <a
            // href='https://www.instagram.com/ssfkasaragod?utm_source=qr&igsh=MWpscWtmMmZlN3JpOA=='
            target='_blank'
            rel='noopener noreferrer'
            className='hover:text-pink-400 transition-colors duration-300'
          >
            <RiInstagramFill size={25} />
          </a>
          <a
            // href='https://youtube.com/@ssfkasaragod3503?si=lXVlxI3NApgezM0t'
            target='_blank'
            rel='noopener noreferrer'
            className='hover:text-red-400 transition-colors duration-300'
          >
            <FaYoutube size={30} />
          </a>
          <a
            // href='https://www.facebook.com/share/SgretEfjQ7zvBEoB/?mibextid=qi2Omg'
            target='_blank'
            rel='noopener noreferrer'
            className='hover:text-blue-400 transition-colors duration-300'
          >
            <FaFacebookSquare size={25} />
          </a>
        </div>
      </div>
      
      {/* Developer credit */}
      <div className='border-t border-gray-600 pt-4 text-center'>
        <p className='text-gray-300 text-sm'>
          Designed and Developed by{' '}
          <a
            href='https://mohammedzaheer.netlify.app/'
            target='_blank'
            rel='noopener noreferrer'
            className='text-[#c5b987] hover:text-blue-300 transition-colors duration-300 font-medium'
          >
            zaheer Posoat
          </a>
        </p>
      </div>
    </div>
  );
}

export default Footer;


// import Image from 'next/image'
// import font from '../public/fontssf.png';
// import { RiInstagramFill } from "react-icons/ri";
// import { FaYoutube } from "react-icons/fa6";
// import { FaFacebookSquare } from "react-icons/fa";

// function Footer() {
//   return (
//     <div className='p-6 px-12 lg:px-36 md:px-24 py-10 flex justify-between items-center shadow-xl w-full '>
//       <div>
//         <Image src={font} sizes='100%' className='w-[50%] ' loading='lazy' quality={100} alt='ssf' />
//         <h1 className='font-extrabold text-base md:text-lg uppercase'>Kasaragod</h1>
//       </div>
//       <div className='flex gap-1 items-center'>
//       <RiInstagramFill size={25} />
//       <FaYoutube size={30} />
//       <FaFacebookSquare  size={25}/>
//       </div>
//     </div>
//   )
// }

// export default Footer
