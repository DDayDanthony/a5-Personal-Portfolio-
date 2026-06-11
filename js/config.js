// ===========================================
// the only file you should normally need to edit
// paste your published google sheet CSV links here
// see README for how to get these links
// ===========================================

const SHEET_URLS = {
  original: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRX4ykwKCZBDRz3LuS_S-yHLpMa-BPeSdUcRT5owE2gBfbbBe-vENggIBYtP1RmImgwFwvch9VXw-fr/pub?gid=0&single=true&output=csv",
  fanart: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRX4ykwKCZBDRz3LuS_S-yHLpMa-BPeSdUcRT5owE2gBfbbBe-vENggIBYtP1RmImgwFwvch9VXw-fr/pub?gid=1758157628&single=true&output=csv",
  commissions: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRX4ykwKCZBDRz3LuS_S-yHLpMa-BPeSdUcRT5owE2gBfbbBe-vENggIBYtP1RmImgwFwvch9VXw-fr/pub?gid=1962887599&single=true&output=csv",
  blog: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRX4ykwKCZBDRz3LuS_S-yHLpMa-BPeSdUcRT5owE2gBfbbBe-vENggIBYtP1RmImgwFwvch9VXw-fr/pub?gid=626238044&single=true&output=csv"
};

// how many items show in the homepage carousel
const CAROUSEL_ITEM_COUNT = 10;