require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
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

app.get("/test", async (req, res) => {
  res.status(200).send("LOOOL");
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

app.post("/hip", async (req, res) => {
  const hipNumbers = req.body; // Erwarte ein Array von HIP-Nummern
  try {
    await mongoClient.connect();
    const database = mongoClient.db("myDB");
    const collection = database.collection("stars");

    // Abfrage in der Datenbank mit den übergebenen HIP-Nummern
    const stars = await collection
      .find(
        {
          hip: { $in: hipNumbers },
        },
        {
          projection: { x0: 1, y0: 1, z0: 1, dist: 1, ra: 1, dec: 1, hip: 1 }, // Nur x0, y0, z0 Felder abrufen
        }
      )
      .toArray();

    res.json(stars); // Sende die gefilterten Daten zurück zum Client
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ein Fehler ist aufgetreten" });
  } finally {
    await mongoClient.close();
  }
});
app.post("/tyc", async (req, res) => {
  const tycNumbers = req.body; // Erwarte ein Array von HIP-Nummern
  try {
    await mongoClient.connect();
    const database = mongoClient.db("myDB");
    const collection = database.collection("stars");

    // Abfrage in der Datenbank mit den übergebenen HIP-Nummern
    const stars = await collection
      .find(
        {
          tyc: { $in: tycNumbers },
        },
        {
          projection: { x0: 1, y0: 1, z0: 1, dist: 1, ra: 1, dec: 1, tyc: 1 }, // Nur x0, y0, z0 Felder abrufen
        }
      )
      .toArray();

    res.json(stars); // Sende die gefilterten Daten zurück zum Client
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ein Fehler ist aufgetreten" });
  } finally {
    await mongoClient.close();
  }
});

app.get("/top111", async (req, res) => {
  try {
    await mongoClient.connect();
    const db = mongoClient.db("myDB");
    const collection = db.collection("stars");
    const result = await collection
      .find(
        {},
        {
          projection: {
            _id: 0,
            id: 1,
          },
        }
      )
      .sort({ mag: 1 })
      .limit(100)
      .toArray();

    res.json(result);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Ein Fehler ist aufgetret", error: error.message }); 
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

    // Definieren Sie die Felder, die Sie aus der Datenbank abrufen möchten
    const options = {
      projection: {
        _id: 1, // MongoDB ObjectId
        id: 1, // Stern ID
        dist: 1, // Entfernung
        mag: 1, // Sichtbare Helligkeit
        x0: 1, // x-Koordinate
        y0: 1, // y-Koordinate
        z0: 1, // z-Koordinate
        con: 1, // Sternbild
        ci: 1, // Farbindex
        absmag: 1,
        ra: 1,
        dec: 1,
        proper: 1, 
        wikiUrl: 1, 
        hip: 1,
        tyc: 1,
        gaia: 1,
        flam: 1,
        bayer: 1,
      },
    };

    const results = await collection.find(query, options).toArray(); // Suchen mit Optionen und in ein Array konvertieren

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
