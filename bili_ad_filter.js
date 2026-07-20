// Bilibili 信息流 / 视频详情页 广告卡片过滤
// 用于 Shadowrocket [Script] http-response，requires-body=1
//
// 原理：B 站接口把广告卡片和正常内容混在同一个列表里返回，
// 广告卡片一般会带下面这些标记字段之一：
//   - card_goto == "ad" / "ad_av" / "ad_bangumi"
//   - is_ad == true
//   - ad_info / ad_cb / creative_id / cm_mark 等字段存在
// 这里递归遍历 JSON，把含有这些标记的元素从数组里摘掉。
// 接口字段名会不定期变化，如果发现漏网广告，抓包看新字段名，加到 AD_KEYS 里即可。

const AD_KEYS = ["ad_info", "ad_cb", "cm_mark", "creative_id", "is_ad", "ad_pl"];
const AD_GOTO_VALUES = ["ad", "ad_av", "ad_bangumi", "ad_ott", "picture_ad"];

function isAdItem(item) {
  if (!item || typeof item !== "object") return false;
  if (AD_KEYS.some((k) => k in item)) return true;
  if (typeof item.card_goto === "string" && AD_GOTO_VALUES.includes(item.card_goto)) return true;
  if (typeof item.goto === "string" && AD_GOTO_VALUES.includes(item.goto)) return true;
  return false;
}

function stripAds(node) {
  if (Array.isArray(node)) {
    return node.filter((item) => !isAdItem(item)).map(stripAds);
  }
  if (node && typeof node === "object") {
    for (const key of Object.keys(node)) {
      node[key] = stripAds(node[key]);
    }
    return node;
  }
  return node;
}

try {
  const body = $response.body;
  if (body) {
    const json = JSON.parse(body);
    const cleaned = stripAds(json);
    $done({ body: JSON.stringify(cleaned) });
  } else {
    $done({});
  }
} catch (e) {
  // 解析失败就原样放行，避免整个请求挂掉
  $done({});
}
