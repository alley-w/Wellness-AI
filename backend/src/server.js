const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const app = require("./app");
const storageService = require("./services/storageService");
const { seedDemoUser } = require("./demo/seedDemoData");

if (process.env.SEED_DEMO !== "false") {
  seedDemoUser(storageService);
  console.log("[demo] Seeded demo-user (Alex). Set SEED_DEMO=false to skip.");
}

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
