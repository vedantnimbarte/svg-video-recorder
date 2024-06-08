const express = require("express");
const puppeteer = require("puppeteer");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { PuppeteerScreenRecorder } = require("puppeteer-screen-recorder");
const cors = require("cors");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

const upload = multer({ storage: storage });

const app = express();

app.use(cors({ origin: "*" }));

const recordVideoOfSvg = async (filepath, videopath) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--font-render-hinting=none"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 3,
    });
    const svg = fs.readFileSync(filepath, "utf8");
    await page.setContent(svg);
    const Config = {
      fps: 25,
    };

    const recorder = new PuppeteerScreenRecorder(page, Config);

    await recorder.start(videopath);
    await wait(1700);
    // await page.waitForTimeout(1);
    await recorder.stop();
  } catch (error) {
    console.log(error);
  } finally {
    await browser.close();
  }
};

app.post("/upload", upload.single("svg"), async (req, res) => {
  const filepath = req.file.path;
  const videofileName = `${req.file.filename}.mp4`;
  const videopath = `videos/${videofileName}`;
  await recordVideoOfSvg(filepath, videopath);
  fs.rmSync(path.join(__dirname, filepath));
  res.send({
    success: true,
    fileName: req.file.filename,
    videoPath: videofileName,
  });
});

app.get("/video/:filename", (req, res) => {
  const videoPath = path.join(__dirname, "videos", req.params.filename);

  if (fs.existsSync(videoPath)) {
    res.sendFile(videoPath, (err) => {
      if (err) {
        res.status(500).send({ error: "Error sending video file" });
      } else {
        // Delete the video file after it has been sent
        fs.unlink(videoPath, (unlinkErr) => {
          if (unlinkErr) {
            console.error("Error deleting video file:", unlinkErr);
          } else {
            console.log(`Successfully deleted ${req.params.filename}`);
          }
        });
      }
    });
  } else {
    res.status(404).send({ error: "Video not found" });
  }
});

app.listen(3000, () => console.log("Server started on port 3000"));
