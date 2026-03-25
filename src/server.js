import app from "./index.js";
import "dotenv/config";
// Import Scheduled Jobs
import { startAuctionEndNotifier } from "./scripts/auctionEndNotifier.js";

const PORT = Number(process.env.PORT) || 3005;

app.listen(PORT, function () {
  console.log(`Server is running on http://localhost:${PORT}`);

  // Start scheduled jobs
  if (process.env.ENABLE_AUCTION_NOTIFIER !== "false") {
    startAuctionEndNotifier(30);
  } // Check every 30 seconds for ended auctions
});
