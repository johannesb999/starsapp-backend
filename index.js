require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());

const uri = process.env.MONGODB_URI;
const mongoClient = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const hauptSternzeichen = [
  "Ari",
  "Tau",
  "Gem",
  "Cnc",
  "Leo",
  "Vir",
  "Lib",
  "Sco",
  "Sgr",
  "Cap",
  "Aqr",
  "Psc",
];

app.get("/stars/:constellation", async (req, res) => {
  await mongoClient.connect();
  const database = mongoClient.db("myDB"); // Datenbank auswählen
  const collection = database.collection("stars"); // Sammlung auswählen
  const constellation = req.params.constellation;

  try {
    const stars = await collection.find({ con: constellation }).toArray();
    const starsWithProper = stars.filter(
      (star) => star.proper !== null && star.proper !== undefined
    );
    res.json(stars);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
app.post("/stars", async (req, res) => {
  await mongoClient.connect();
  const database = mongoClient.db("myDB"); // Datenbank auswählen
  const collection = database.collection("stars"); // Sammlung auswählen

  const maxmag = parseFloat(req.body.maxmag); // sicherstellen, dass maxmag ein Float ist
  const constellation = req.body.constellation;

  console.log(maxmag, constellation);

  try {
    // Abfrage, um nur Sterne der spezifischen Konstellation und mit einem kleineren mag Wert als maxmag zu finden
    const query = { con: constellation, mag: { $lt: maxmag } };
    const stars = await collection.find(query).toArray();

    // Filtern um sicherzustellen, dass die Eigenschaft 'proper' vorhanden ist
    const starsWithProper = stars.filter(
      (star) => star.proper !== null && star.proper !== undefined
    );

    res.json(starsWithProper);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/hauptkonstellationen", async (req, res) => {
  try {
    await mongoClient.connect();
    const database = mongoClient.db("myDB"); // Datenbank auswählen
    const collection = database.collection("stars");

    const hauptSterne = await collection
      .find({
        con: { $in: hauptSternzeichen },
      })
      .toArray();

    res.json(hauptSterne);
  } catch (error) {
    console.error(
      "Fehler beim Abrufen der Sterne der Hauptkonstellationen: ",
      error
    );
    res.status(500).send("Ein interner Serverfehler ist aufgetreten.");
  } finally {
    await mongoClient.close(); // Stelle sicher, dass die Verbindung geschlossen wird
  }
});

app.get("/info", async (req, res) => {
  try {
    await mongoClient.connect();
    const database = mongoClient.db("myDB"); // Datenbank auswählen
    const collection = database.collection("stars");

    // Verwende die Aggregationspipeline, um einzigartige 'con'-Werte zu finden
    const uniqueCons = await collection
      .aggregate([
        {
          $group: {
            _id: "$con", // Gruppiere Dokumente nach dem 'con'-Wert
          },
        },
        {
          $project: {
            _id: 0, // Schließe die '_id' aus der Ausgabe aus
            con: "$_id", // Benenne '_id' (die einzigartigen 'con'-Werte) um in 'con'
          },
        },
        {
          $sort: { con: 1 }, // Optional: Sortiere die Ergebnisse alphabetisch
        },
      ])
      .toArray();

    res.json(uniqueCons); // Sende die einzigartigen 'con'-Werte als Antwort
  } catch (error) {
    console.error("Fehler beim Abrufen der Informationen: ", error);
    res.status(500).send("Ein interner Serverfehler ist aufgetreten.");
  } finally {
    await mongoClient.close(); // Stelle sicher, dass die Verbindung geschlossen wird
  }
});

app.post("/all-stars", async (req, res) => {
  const maxMag = parseFloat(req.body.maxmag); // Stellen Sie sicher, dass maxmag eine Zahl ist
  if (isNaN(maxMag)) {
    return res.status(400).send("maxmag muss eine gültige Zahl sein.");
  }

  try {
    await mongoClient.connect();
    const database = mongoClient.db("myDB"); // Datenbank auswählen
    const collection = database.collection("stars");

    // Erstellen Sie die Abfrage, um Sterne basierend auf der Helligkeit zu filtern
    const query = { mag: { $lte: maxMag } };
    const results = await collection.find(query).toArray(); // Suchen und in ein Array konvertieren

    res.json(results); // Ergebnisse als JSON senden
  } catch (e) {
    console.error(e);
    res.status(500).send("Fehler bei der Datenbankverbindung oder -abfrage.");
  } finally {
    await mongoClient.close(); // Datenbankverbindung schließen
  }
});
const PORT = process.env.USERSERVICE_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
