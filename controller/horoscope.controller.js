const axios = require("axios");
const moment = require("moment");
const JSSoup = require("jssoup").default;
const db = require("../models");
const User = db.user;

const horoscopeApiUserId = process.env.ASTROLOGY_USER_ID;
const apiKey = process.env.ASTROLOGY_API_KEY;
const horoscropApiUrl = "https://json.astrologyapi.com/v1/";

exports.getDayHints = async (req, res) => {
  const { sign, day } = req.params;
  try {
    const response = await axios.get(
      `https://www.horoscope.com/star-ratings/${day}/${sign}`
    );
    const soup = new JSSoup(response.data);
    const data = soup.find("div", (attrs = { class: "general-mood" }));
    const todayHints = {};
    for (let i = 1; i < data.parent.contents.length - 2; i++) {
      if (i % 2 === 1) {
        todayHints[data.parent.contents[i].getText()] =
          data.parent.contents[i + 1].getText();
      }
    }
    res.send({ data: todayHints });
  } catch (e) {
    console.log(e);
    res.send({
      data: {},
    });
  }
};

exports.getHoroscopeByDay = async (req, res) => {
  const { sign, day } = req.params;
  console.log(sign, day);
  try {
    let response;
    if (day.indexOf("-") > -1) {
      response = await axios.get(
        `https://www.horoscope.com/us/horoscopes/general/horoscope-archive.aspx?sign=${sign}&laDate=${day.replace(
          /-/g,
          ""
        )}`
      );
    } else {
      response = await axios.get(
        `https://www.horoscope.com/us/horoscopes/general/horoscope-general-daily-${day}.aspx?sign=${sign}`
      );
    }

    const soup = new JSSoup(response.data);
    const data = soup.find("div", (attrs = { class: "main-horoscope" }));
    const result = data.nextElement.nextSibling.getText("\n\n");
    res.send({
      data: result.split("-").slice(1).join(""),
    });
  } catch (e) {
    console.log(e);
    res.send({
      data: "",
    });
  }
};

exports.getHoroscopeWM = async (req, res) => {
  const { sign, day } = req.params;
  console.log(sign, day);
  try {
    const url = `https://www.horoscope.com/us/horoscopes/general/horoscope-general-${day}.aspx?sign=${sign}`;
    let response = await axios.get(url);

    const soup = new JSSoup(response.data);
    if (day === "monthly") {
      const upsell = soup.find("a", (attrs = { class: "upsell-banner" }));
      upsell?.extract();
    }

    const data = soup.find("div", (attrs = { class: "main-horoscope" }));
    const result = data.nextElement.nextSibling.getText("\n\n");
    res.send({
      data: result
        .split("-")
        .slice(day === "weekly" ? 2 : 1)
        .join(""),
    });
  } catch (e) {
    console.log(e);
    res.send({
      data: "",
    });
  }
};

exports.getHoroscopeYearly = async (req, res) => {
  const { sign, year } = req.params;
  try {
    const url = `https://www.horoscope.com/us/horoscopes/yearly/${year}-horoscope-${sign}.aspx`;
    let response = await axios.get(url);

    const soup = new JSSoup(response.data);

    const iElements = soup.findAll("i");
    iElements.map((iElement) => {
      iElement.extract();
    });

    const data = soup.find("section", (attrs = { id: "personal" }));
    const result = data.nextElement.nextSibling.getText("\n\n");
    res.send({
      data: result.replace(/âœ¨/g, "").trim(),
    });
  } catch (e) {
    console.log(e);
    res.send({
      data: "",
    });
  }
};

exports.getPersonalDay = async (req, res) => {
  const { userId } = req.query;
  const api = "personal_day_prediction";
  try {
    const user = await User.findById(userId);
    if (user) {
      const auth =
        "Basic " +
        Buffer.from(horoscopeApiUserId + ":" + apiKey).toString("base64");
      const data = {
        date: moment(user.birth).format("D"),
        month: moment(user.birth).format("M"),
        year: moment(user.birth).format("YYYY"),
        full_name: user.fullname || "Anonymous",
      };
  
      const result = await axios
        .post(horoscropApiUrl + api, data, {
          headers: {
            authorization: auth,
            "Content-Type": "application/json",
          },
        })
        .catch((e) => {
          console.log(e.response.data);
          return e.response;
        });
      return res.send(result.data);
    } else {
      return res.send({
        data: {},
        logout: true
      });
    }
  } catch (e) {
    console.log(e);
    return res.send({
      data: {},
    });
  }
};

exports.getPlanetsReport = async (req, res) => {
  try {
    const api = "solar_return_planet_report";
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      res.send({ msg: "user_not_exists", logout: true });
      return;
    }
    const data = {
      date: moment(user.birth).format("D"),
      month: moment(user.birth).format("M"),
      year: moment(user.birth).format("YYYY"),
      hour: moment(user.birth).format("H"),
      min: moment(user.birth).format("M"),
      lat: user.geometry.lat,
      lon: user.geometry.lng,
      tzone: user.utcoffset,
    };
    const auth =
      "Basic " +
      Buffer.from(horoscopeApiUserId + ":" + apiKey).toString("base64");
    const result = await axios.post(horoscropApiUrl + api, data, {
      headers: {
        authorization: auth,
        "Content-Type": "application/json",
      },
    });

    // console.log(result.data);
    res.send(result.data);
  } catch (error) {
    console.log(error);
    res.send({ data: [] });
  }
};

exports.getPlanets = async (req, res) => {
  try {
    const api = "solar_return_planets";
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      res.send({ msg: "user_not_exists", logout: true });
      return;
    }
    const data = {
      date: moment(user.birth).format("D"),
      month: moment(user.birth).format("M"),
      year: moment(user.birth).format("YYYY"),
      hour: moment(user.birth).format("H"),
      min: moment(user.birth).format("M"),
      lat: user.geometry.lat,
      lon: user.geometry.lng,
      tzone: user.utcoffset,
    };

    const auth =
      "Basic " +
      Buffer.from(horoscopeApiUserId + ":" + apiKey).toString("base64");

    const result = await axios.post(horoscropApiUrl + api, data, {
      headers: {
        authorization: auth,
        "Content-Type": "application/json",
      },
    });
    res.send(result.data);
  } catch (error) {
    console.log(error);
    res.send({ msg: "user_not_exists" });
  }
};

exports.getPredictionDaily = async (req, res) => {
  const { zodiacName, type } = req.params;
  const { timeZone } = req.query;
  console.log(zodiacName, type, timeZone);
  try {
    const result = await axios.post(
      `${horoscropApiUrl}sun_sign_prediction/daily/${zodiacName}`,
      {
        timezone: timeZone,
      },
      {
        headers: {
          authorization: auth,
          "Content-Type": "application/json",
        },
      }
    );

    res.send(result.data);
  } catch (error) {
    res.status(401).send(error);
  }
};

exports.getDoDonotDaily = async (req, res) => {
  const { userId } = req.query;
  const user = await User.findById(userId);
  if (!user) {
    res.send({ do: [], donot: [], logout: true });
    return;
  }
  try {
    const dothings = {
      aries: ["active", "vibrant", "frank", "straightforward", "enthusiastic"],
      taurus: [
        "stability",
        "dependability",
        "blend",
        "grow",
        "appreciate",
        "artistic",
        "color",
        "music",
        "materialistic",
        "luxurious",
        "good food",
        "good drinks",
      ],
      gemini: [
        "intellectual",
        "versatile",
        "wits",
        "mentally stimulated",
        "conversing",
        "sense of humor",
        "communicative",
        "holding hands",
      ],
      cancer: [
        "adapt",
        "changing moods",
        "adjust",
        "moody",
        "sensitive",
        "fluctuating",
        "food",
        "cook",
        "poetic",
        "romantic",
      ],
      leo: [
        "respect",
        "majestic manners",
        "accept advice",
        "showman",
        "grand style",
        "flattery",
        "center of attraction",
        "theatrical",
      ],
      virgo: [
        "methodical",
        "sense of duty",
        "emphasize qualities",
        "keen interest",
        "help",
        "mental powers",
        "appreciate",
        "success",
      ],
      libra: [
        "peace",
        "harmony",
        "compliment beauty",
        "seek union",
        "partnership",
        "beautiful moments",
        "pleasurable moments",
      ],
      scorpio: [
        "passion",
        "zest for life",
        "drive",
        "tune in",
        "harmony",
        "loyalty",
        "share passion",
        "intensity",
        "enjoy life",
      ],
      sagittarius: [
        "happy go lucky",
        "zest",
        "enthusiasm",
        "share interests",
        "hobbies",
        "truthful opinion",
        "optimism",
      ],
      capricorn: [
        "strong",
        "dependable",
        "practical",
        "conservative",
        "blend in",
        "maintain standards",
        "social status",
        "image",
      ],
      aquarius: [
        "friendly",
        "fascinating",
        "in-depth knowledge",
        "love",
        "broad outlook",
        "humanitarian causes",
        "mysterious",
        "intriguing",
        "faithfulness",
      ],
      pisces: [
        "sensitivity",
        "charm",
        "understanding",
        "appreciation",
        "help",
        "sixth sense",
        "intuition",
        "dreams",
      ],
    };

    const donotthings = {
      aries: ["wrong", "stir", "jealous", "flirtation", "fooling around"],
      taurus: [
        "temper",
        "unreasonable",
        "aggressive",
        "press",
        "violent rage",
        "possessive",
        "suffocating",
      ],
      gemini: [
        "stability",
        "hold back",
        "restless",
        "change",
        "adopt",
        "orthodox",
        "conservative",
        "flow against the current",
      ],
      cancer: [
        "hurt",
        "play with emotions",
        "sentiments",
        "discard",
        "emotional bonds",
        "vulnerable",
        "contradict",
        "confusion",
      ],
      leo: [
        "hurt ego",
        "pride",
        "vanity",
        "authoritative",
        "gloomy",
        "depressed",
        "crying",
        "worries",
      ],
      virgo: [
        "push into limelight",
        "center stage",
        "shy",
        "reserved",
        "secrets",
        "skeleton-closet",
        "tarnish public image",
      ],
      libra: [
        "argumentative",
        "start arguments",
        "discussion",
        "hate to lose",
        "change sides",
        "push into decisions",
        "weighing pros and cons",
        "impatience",
      ],
      scorpio: [
        "possessiveness",
        "jealousy",
        "explosive tempers",
        "handle with care",
        "flirtation",
      ],
      sagittarius: [
        "restriction",
        "hold back",
        "freedom",
        "irritation",
        "exaggeration",
        "rudeness",
        "offense",
      ],
      capricorn: [
        "secrecy",
        "reservation",
        "thoroughness",
        "sloppiness",
        "tight-fistedness",
        "economy",
        "no romance",
        "practical gifts",
      ],
      aquarius: [
        "predictability",
        "restlessness",
        "boredom",
        "emotional detachment",
        "impersonality",
      ],
      pisces: [
        "worldly ambitions",
        "materialism",
        "insensitivity",
        "disregard for feelings",
        "emotional overwhelm",
      ],
    };

    let doSign = dothings[user.sunsign.toLowerCase()];
    let donotSign = donotthings[user.sunsign.toLowerCase()];
    const result = {
      do: [],
      donot: [],
    };
    for (let i = 0; i < 3; i++) {
      const ind = Math.floor(Math.random() * doSign.length);
      result.do.push(doSign[ind]);
      doSign = doSign.filter((v, vi) => vi !== ind);
    }

    for (let i = 0; i < 3; i++) {
      const ind = Math.floor(Math.random() * donotSign.length);
      result.donot.push(donotSign[ind]);
      donotSign = donotSign.filter((v, vi) => vi !== ind);
    }
    res.send(result);
  } catch (error) {
    console.log(error);
    res.send({ do: [], donot: [] });
  }
};
