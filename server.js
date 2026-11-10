require("dotenv").config();
const app = require("./src/app");
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("");
  console.log("========================================");
  console.log("  DEMO DE SEGURANCA RODANDO");
  console.log("  http://localhost:" + PORT);
  console.log("========================================");
  console.log("");
});
