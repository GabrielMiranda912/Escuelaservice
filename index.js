import express from "express";
import multer from "multer";
import fs from "fs";
import readline from "readline";
import path from "path";
const app = express();
const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    const extname = path.extname(file.originalname);
    if (extname !== ".txt") {
      return cb(new Error("Solo se permiten archivos con extensión .txt"));
    }
    cb(null, true);
  },
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/inforuser", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No se ha subido ningún archivo");
  }
  const filePath = req.file.path;
  try {
    const results = await processLineByLine(filePath);
    res.json({
      message: "Archivo recibido y procesado correctamente",
      data: results,
    });
  } catch (error) {
    console.error("Error procesando el archivo:", error);
    res.status(500).send("Error procesando el archivo");
  } finally {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error al eliminar el archivo:", err);
      }
    });
  }
});

async function processLineByLine(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const results = [];

  for await (const line of rl) {
    const dni = line.substring(62, 74);
    const nombrecliente = line.substring(224, 374);
    const years = line.substring(542, 546);
    const meses = line.substring(546, 548);
    const fechapago = years + "/" + meses;
    const valor1 = line.substring(535, 537);
    const valor2 = line.substring(537, 539);
    const totalpagar = valor1 + "." + valor2;

    results.push({
      dni: dni.trim(),
      nombrecliente: nombrecliente.trim(),
      fechapago: fechapago,
      totalpagar: totalpagar,
    });
  }

  return results;
}

app.use((req, res, next) => {
  res.status(404).send("La ruta solicitada no se encuentra.");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
