// ===========================================
// main.js
// pulls data from google sheets and builds the galleries/carousel/blog
// ===========================================

// basic csv parser - handles quoted commas ok, nothing fancier
function parseCSV(text) {
  const rows = [];
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "") continue; // skip blank lines

    let row = [];
    let cur = "";
    let inQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      let char = lines[i][j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        row.push(cur.trim());
        cur = "";
      } else {
        cur += char;
      }
    }
    row.push(cur.trim());
    rows.push(row);
  }

  // first row is the headers (title, imageurl, etc)
  const headers = rows[0].map(h => h.toLowerCase().trim());
  const data = [];

  for (let i = 1; i < rows.length; i++) {
    let obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = rows[i][j] ? rows[i][j].trim() : "";
    }
    data.push(obj);
  }

  return data;
}

// fetches a sheet url and turns it into an array of objects
async function loadSheet(url) {
  if (!url || url.indexOf("PASTE_") === 0) {
    console.warn("Sheet URL not set up yet:", url);
    return [];
  }
  try {
    const res = await fetch(url);
    const text = await res.text();
    return parseCSV(text);
  } catch (err) {
    console.error("couldnt load sheet :(", err);
    return [];
  }
}

// converts a normal google drive share link into a direct image link
function fixDriveLink(url) {
  if (!url) return "";
  if (url.indexOf("uc?export=view") !== -1) return url; // already direct

  // share links look like .../d/FILE_ID/view, grab the FILE_ID
  const match = url.match(/\/d\/(.+?)\//);
  if (match) return "https://drive.google.com/uc?export=view&id=" + match[1];

  return url; // not a drive link, just use as-is
}

// checks localStorage for the nsfw toggle state
function showMature() {
  return localStorage.getItem("nsfwOk") === "true";
}

// ===== nsfw toggle setup =====
const nsfwCheckbox = document.getElementById("nsfwToggle");
if (nsfwCheckbox) {
  nsfwCheckbox.checked = showMature(); // restore saved setting

  nsfwCheckbox.addEventListener("change", function () {
    localStorage.setItem("nsfwOk", nsfwCheckbox.checked ? "true" : "false");
    location.reload(); // reload so galleries update
  });
}

// ===== lightbox (click image to view bigger) =====
function openLightbox(src) {
  const lb = document.getElementById("lightbox");
  const img = document.getElementById("lightboxImg");
  if (!lb || !img) return;
  img.src = src;
  lb.classList.add("active");
}

function closeLightbox() {
  const lb = document.getElementById("lightbox");
  if (lb) lb.classList.remove("active");
}

// ===== carousel arrow buttons =====
function scrollCarousel(dir) {
  const track = document.getElementById("carouselTrack");
  if (!track) return;
  track.scrollBy({ left: dir * 240, behavior: "smooth" });
}

// builds the homepage carousel using a random mix from all 3 galleries
async function buildCarousel() {
  const track = document.getElementById("carouselTrack");
  if (!track) return; // not on homepage, skip

  const original = await loadSheet(SHEET_URLS.original);
  const fanart = await loadSheet(SHEET_URLS.fanart);
  const commissions = await loadSheet(SHEET_URLS.commissions);

  let combined = [...original, ...fanart, ...commissions];

  // hide mature stuff if toggle is off
  if (!showMature()) {
    combined = combined.filter(item => item.mature !== "TRUE");
  }

  // shuffle so it's different each load
  combined.sort(() => Math.random() - 0.5);
  combined = combined.slice(0, CAROUSEL_ITEM_COUNT);

  track.innerHTML = "";

  if (combined.length === 0) {
    track.innerHTML = '<div class="carousel-item placeholder">No art yet, add some to your sheet!</div>';
    return;
  }

  combined.forEach(item => {
    const div = document.createElement("div");
    div.className = "carousel-item";

    const img = document.createElement("img");
    img.src = fixDriveLink(item.imageurl);
    img.alt = item.title || "artwork";
    img.onclick = () => openLightbox(img.src);

    div.appendChild(img);
    track.appendChild(div);
  });
}

// builds a gallery grid for original/fanart/commissions pages
// galleryType matches the keys in SHEET_URLS
async function buildGallery(galleryType) {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;

  const data = await loadSheet(SHEET_URLS[galleryType]);
  grid.innerHTML = "";

  if (data.length === 0) {
    grid.innerHTML = "<p>No items yet. Add some rows to your Google Sheet!</p>";
    return;
  }

  data.forEach(item => {
    const isMature = item.mature === "TRUE";

    // skip mature items entirely if toggle is off
    if (isMature && !showMature()) return;

    const wrap = document.createElement("div");
    wrap.className = "gallery-item-wrap";

    const div = document.createElement("div");
    div.className = "gallery-item";
    if (isMature) div.classList.add("mature");

    const img = document.createElement("img");
    img.src = fixDriveLink(item.imageurl);
    img.alt = item.title || "artwork";
    img.onclick = () => openLightbox(img.src);

    const caption = document.createElement("div");
    caption.className = "caption";

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = item.title || "Untitled";

    const tags = document.createElement("div");
    tags.className = "tags";
    tags.textContent = item.tags || "";

    caption.appendChild(title);
    caption.appendChild(tags);
    div.appendChild(img);
    div.appendChild(caption);

    if (isMature) {
      const label = document.createElement("div");
      label.className = "mature-label";
      label.textContent = "Mature";
      wrap.appendChild(label);
    }

    wrap.appendChild(div);
    grid.appendChild(wrap);
  });
}

// builds the blog post list, newest first
async function buildBlog() {
  const container = document.getElementById("blogPosts");
  if (!container) return;

  const data = await loadSheet(SHEET_URLS.blog);
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = "<p>No posts yet.</p>";
    return;
  }

  // sheet is oldest-first, so reverse to get newest-first
  data.reverse();

  data.forEach(post => {
    const div = document.createElement("div");
    div.className = "blog-post";

    let html = "";
    html += '<div class="date">' + (post.date || "") + "</div>";
    html += "<h2>" + (post.title || "Untitled Post") + "</h2>";
    html += "<p>" + (post.content || "") + "</p>";

    if (post.imageurl) {
      html += '<img src="' + fixDriveLink(post.imageurl) + '" alt="">';
    }

    div.innerHTML = html;
    container.appendChild(div);
  });
}

// builds the blog preview on the homepage, shows 3 most recent posts
async function buildBlogPreview() {
  const container = document.getElementById("blogPreview");
  if (!container) return;

  const data = await loadSheet(SHEET_URLS.blog);
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = "<p>No posts yet.</p>";
    return;
  }

  // show only the 3 most recent posts
  const recent = [...data].reverse().slice(0, 3);

  recent.forEach(post => {
    const div = document.createElement("div");
    div.className = "blog-post-preview";
    div.innerHTML = `
      <div class="date">${post.date || ""}</div>
      <h3>${post.title || "Untitled"}</h3>
      <p>${post.content || ""}</p>
    `;
    container.appendChild(div);
  });
}

// ===== run everything on page load =====
buildCarousel();
buildBlog();
buildBlogPreview();

// only build a gallery if this page has a gallery grid
const grid = document.getElementById("galleryGrid");
if (grid) {
  // body tag tells us which gallery to load (original/fanart/commissions)
  const galleryType = document.body.getAttribute("data-gallery");
  if (galleryType) {
    buildGallery(galleryType);
  } else {
    console.warn("no data-gallery attribute set on <body>, dunno which gallery to load");
  }
}