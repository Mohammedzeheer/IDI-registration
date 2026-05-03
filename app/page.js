import Head from 'next/head';
import Link from 'next/link';
import Registration from '../components/Registration';

export default function Home() {
  return (
    <>
      <Head>
        <title>Event Management System</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8"> */}
        <div>
        <Registration />
      </div>
    </>
  );
}



// import Hero from '../components/Hero';
// import Gallery from '../components/Gallery';
// import Result from '../components/ResultHome';

// export default function App() {

//   return (
//     <main>
//        <Hero />    
//        <Gallery />   
//        <Result />   
//     </main>
//   );
// }