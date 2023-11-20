import Navbar from "@/components/Navbar";
import "@/styles/globals.css";
import Head from "next/head";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Decentroz</title>
      </Head>
      <Navbar />
      <Component {...pageProps} />
    </>
  );
}
