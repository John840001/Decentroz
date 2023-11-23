// pages/api/blockchainData.js
import { fetchToken } from "./middleware/blockcahin";

export default async function handler(req, res) {
  try {
    // console.log("Req: ", req.body.account);
    const address = req.body.account
    const blockchainData = await fetchToken(address);
    // console.log("API", blockchainData);

    // Send the data to the frontend
    res.status(200).json({ data: blockchainData });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}
