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
    // const stars = await collection.aggregate([
    //   { $match: { con: constellation } }, // Filtern nach Sternbild
    //   { $group: { _id: '$con', stars: { $push: '$$ROOT' } } }, // Gruppieren nach Sternbild
    // ]).toArray();
    const stars = await collection.find({ con: constellation }).toArray();
    const starsWithProper = stars.filter(
      (star) => star.proper !== null && star.proper !== undefined
    ); // Filtern nach 'proper'-Attribut      console.log(starringstars);
    // console.log(typeof stars);
    // console.log(starsWithProper);
    res.json(stars);
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

const PORT = process.env.USERSERVICE_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
