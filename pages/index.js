export default function Home() {
   return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-t from-primary to-secondary">
      <div className=" p-10  max-w-6xl ">
        <h1 className="text-7xl font-semibold mb-4 text-center mt-6 text-primary">
          Decentroz
        </h1>
        <p className="mb-8 text-3xl  text-center text-white">
          Discover a decentralized art universe with our NFT marketplace — a hub
          where creators mint and trade unique digital assets securely on the
          blockchain. Welcome to our NFT marketplace, the home of rare digital
          treasures. Explore, collect, and trade one-of-a-kind NFTs crafted by
          talented creators around the globe. Step into the future of digital
          ownership. Our NFT marketplace empowers artists and collectors to
          engage in a borderless exchange of unique, blockchain-verified
          creations.
        </p>
        <div className="mb-6">
          <h2 className="text-3xl font-semibold mb-2 ">Key Features:</h2>
          <ul className="list-disc list-inside text-2xl ">
            <li>Create a Unique NFT of your own.</li>
            <li>Use Tokens maintained by the System.</li>
            <li>Trade your NFT with people in the network.</li>
          </ul>
        </div>
        <div className="mb-6">
          <h2 className="text-3xl font-semibold mb-2 ">Get Started:</h2>
          <p className="text-2xl">
            To get started, connect your wallet and explore the amazing world of
            decentralized NFTs and the marketplace.
          </p>
        </div>
        <div className="flex justify-center">
          <button className="bg-blue-500 text-white px-4 py-2 rounded-2xl text-2xl bg-secondary">
            Connect Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
