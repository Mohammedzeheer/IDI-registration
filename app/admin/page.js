'use client'
import Head from 'next/head';
import AdminLogin from '../../components/AdminLogin';


export default function Home() {
  return (
    <>
      <Head>
        <title>IDI Career Guidance Programme</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen ">
        <AdminLogin />
      </div>
    </>
  );
}