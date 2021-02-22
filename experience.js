const baseUrl = `https://intra.epitech.eu`;

const xpAct = [
  {
    key: 1,
    name: "Talk",
    xpWinPart: 1,
    xpWinOrg: 4,
    xpLostPart: 1,
    limitPart: 15,
    limitOrg: 6,
    nbPart: 0,
    nbOrg: 0,
  },
  {
    key: 2,
    name: "Workshop",
    xpWinPart: 2,
    xpWinOrg: 7,
    xpLostPart: 2,
    limitPart: 10,
    limitOrg: 3,
    nbPart: 0,
    nbOrg: 0,
  },
  {
    key: 3,
    name: "Hackathon",
    xpWinPart: 6,
    xpWinOrg: 15,
    xpLostPart: 6,
    limitPart: 100,
    limitOrg: 100,
    nbPart: 0,
    nbOrg: 0,
  },
];

const me = { nbXps: 0, nbXpsSoon: 0, present: [], absent: [], soon: [] };

const requestGet = async (url) => {
  let data;

  try {
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
    });
    data = await res.json();
  } catch (e) {
    console.log(e);
    throw "Invalid request";
  }
  return data;
};

const getProfil = async () => {
  return await requestGet(`${baseUrl}/user/?format=json`);
};

const getActivitiesHub = async (region) => {
  return await requestGet(
    `${baseUrl}/module/2020/B-INN-000/${region}-0-1/?format=json`
  );
};

const sortDate = (a, b) => {
  const [dateA, dateB] = [new Date(a.start), new Date(b.start)];

  return dateA - dateB;
};

const addActivite = (title, type, status, date) => {
  const findAct = xpAct.find((act) => act.name === type);
  const {
    limitPart,
    xpWinPart,
    xpWinOrg,
    nbPart,
    xpLostPart,
    nbOrg,
    limitOrg,
  } = findAct;

  switch (status) {
    case "present":
      nbPart < limitPart && (me.nbXps += xpWinPart) && (findAct.nbPart += 1);
      me.present.push({ title, type, status, date });
      break;
    case "absent":
      me.nbXps -= xpLostPart;
      me.absent.push({ title, type, status, date });
      break;
    case "organisateur":
      nbOrg < limitOrg && (me.nbXps += xpWinOrg) && (findAct.nbOrg += 1);
      me.present.push({ title, type, status: "organisateur", date });
      break;
    case "soon":
      me.soon.push({ title, type, status: "inscrit", date });
      break;
    default:
      break;
  }
};

const countXpSoon = () => {
  me.soon.map((act) => {
    const findAct = xpAct.find((elem) => elem.name === act.type);
    const { xpWinPart, limitPart, nbPart } = findAct;
    nbPart < limitPart && (me.nbXpsSoon += xpWinPart) && findAct.nbPart++;
  });
};

const getXp = async () => {
  const { login, location } = await getProfil();
  const activitiesPays = (await getActivitiesHub(location.split("/")[0]))
    ?.activites;
  const activitiesRegion = (await getActivitiesHub(location.split("/")[1]))
    ?.activites;
  const activities = activitiesPays.concat(activitiesRegion).sort(sortDate);
  const strRegex = xpAct.map((a, index) => {
    const name = `(${a.name})`;
    if (index + 1 !== xpAct.length) return name + "|";
    return name;
  });
  const regexExp = new RegExp(`^${strRegex.join("")}$`);

  activities.map((activite) => {
    const typeAct = regexExp.exec(activite?.type_title);

    activite.events.map((event) => {
      if (typeAct) {
        if (event?.user_status)
          addActivite(
            activite.title,
            typeAct[0],
            event.user_status,
            event.begin
          );
        else if (
          event?.assistants?.find((assistant) => assistant.login === login)
        )
          addActivite(activite.title, typeAct[0], "organisateur", event.begin);
        else if (event?.already_register)
          addActivite(activite.title, typeAct[0], "soon", event.begin);
      }
    });
  });
  countXpSoon();

  value.innerHTML =
    lang === "fr"
      ? `Validées : ${me.nbXps} / En cours : ${me.nbXpsSoon}`
      : `Validated : ${me.nbXps} / In progress : ${me.nbXpsSoon}`;
};

const insertAfter = (newNode, referenceNode) => {
  if (referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }
};

const findElemByText = (tag, text, xpathType) => {
  const node = document.evaluate(
    `//${tag}[text()="${text}"]`,
    document,
    null,
    xpathType,
    null
  );
  return node;
};

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

const lang = getCookie("language");

const neartag = findElemByText(
  "label",
  "G.P.A.",
  XPathResult.FIRST_ORDERED_NODE_TYPE
)?.singleNodeValue;

const title = document.createElement("label");
title.innerHTML = "HUB XP";
const value = document.createElement("span");
value.classList.add("value");
value.innerHTML = lang === "fr" ? "Chargement..." : "Loading...";
insertAfter(title, neartag.nextElementSibling);
insertAfter(value, title);

getXp();
