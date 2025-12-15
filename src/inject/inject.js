chrome.extension.onMessage.addListener((req, sender, respond) => {
  console.log("inject.js: Message Received! [" + req + "]");
  if (req === "ScriptRunning") {
    respond("true");
  } else if (req === "StopScript") {
    clearTimeout(newPageTimeout);
    console.log("inject.js: StopScript received.");
    respond("true");
  }
});

// Used to scale the random time generated for switching pages
let clickFactor = 1;

let googleSearch = false;
if (/^https?:\/\/www\.google\.com\/search/.test(window.location)) {
  googleSearch = true;
  clickFactor = 0.4;
}

// Disable autocomplete on page so accounts aren't automatically logged into
const inputnodes = document.getElementsByTagName("input");
for (let i = 0; i < inputnodes.length; i++) {
  inputnodes[i].setAttribute("autocomplete", "blah");
  inputnodes[i].setAttribute("name", " ");
}

const formnodes = document.getElementsByTagName("form");
for (let i = 0; i < formnodes.length; i++) {
  formnodes[i].setAttribute("autocomplete", "blah");
}

const linksOnPage = document.getElementsByTagName("a");

// Filter the list of links
const links = [];
for (let i = 0; i < linksOnPage.length; ++i) {
  const link = linksOnPage[i];
  // Remove any link that does not begin with http or https or is a Bookmark
  if (/^http/.test(link) && !/#\S*$/.test(link)) {
    if (googleSearch && /^https?:\/\/[^/]*google[^/]*\//.test(link)) {
      // Skip Google URLs when on a Google search page
    } else {
      links.push(link);
    }
  }
}

console.log("Links Found: [" + links.length + "] of [" + linksOnPage.length + "]");

if (links.length > 0) {
  const selectedLink = randInt(0, links.length - 1);

  const maxTime = Math.round(scriptOptions.maxTimeBetweenClicks * clickFactor);
  const delay = randInt(Math.floor(maxTime * scriptOptions.timeBetweenClicksVariance * clickFactor), maxTime) * 1000;
  console.log("Using Delay: [" + scriptOptions.maxTimeBetweenClicks + "]");
  console.log("New URL: [" + links[selectedLink] + "] in " + delay + "ms");
  var newPageTimeout = setTimeout(
    function () {
      window.location = links[selectedLink];
    },
    delay
  );
} else {
  console.log("!!No links found.");
}

// Attempt to disable "Are you sure you want to leave" popups
window.onbeforeunload = null;
window.onunload = null;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
