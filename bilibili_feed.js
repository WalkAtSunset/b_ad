/**
 * bilibili_feed.js
 * 过滤信息流（首页推荐 / 热门 / 搜索）中的广告卡片
 * 兼容多版本 API 响应结构
 */

(() => {
  const body = $response.body;
  if (!body || body.length === 0) return $done({});

  let obj;
  try {
    obj = JSON.parse(body);
  } catch (e) {
    // 非 JSON 响应直接放行
    return $done({ body });
  }

  // 广告类型标识集合
  const AD_GOTO_SET = new Set([
    "ad", "cm", "banner_ad", "inline_ad",
    "player_pre_ad", "display_ad"
  ]);

  const AD_CARD_TYPES = new Set([
    "ad", "banner", "inline_banner", "cm", "player_pre",
    "big_banner", "small_cover_v2_ad", "threePointV2_ad"
  ]);

  /**
   * 判断单个 item 是否是广告
   */
  function isAd(item) {
    if (!item || typeof item !== "object") return false;

    // goto 字段匹配
    if (item.goto && AD_GOTO_SET.has(item.goto)) return true;

    // card_type 字段匹配
    if (item.card_type && AD_CARD_TYPES.has(item.card_type)) return true;

    // 含有 ad_info 字段
    if (item.ad_info) return true;

    // 含有 is_ad 标记
    if (item.is_ad === 1 || item.is_ad === true) return true;

    // card_goto 包含 ad
    if (item.card_goto && item.card_goto.toLowerCase().includes("ad")) return true;

    // 商业内容标记
    if (item.rcmd_reason && item.rcmd_reason.content &&
        item.rcmd_reason.content.includes("广告")) return true;

    return false;
  }

  /**
   * 递归过滤数组中的广告项
   */
  function filterAds(arr) {
    if (!Array.isArray(arr)) return arr;
    return arr.filter(item => !isAd(item));
  }

  // ---- 处理不同 API 路径的数据结构 ----

  if (obj.data) {
    const d = obj.data;

    // /x/v2/feed/index  /x/feed/rcmd
    if (d.items) d.items = filterAds(d.items);

    // /x/v2/dynamic/feed
    if (d.cards) {
      d.cards = d.cards.filter(card => {
        if (!card || !card.desc) return true;
        return card.desc.type !== 4096; // 4096 = 广告
      });
    }

    // 搜索结果
    if (d.result && Array.isArray(d.result)) {
      d.result = d.result.map(group => {
        if (group.data && Array.isArray(group.data)) {
          group.data = group.data.filter(item => {
            if (item.type === "ad" || item.type === "banner") return false;
            return true;
          });
        }
        return group;
      });
    }

    // 通用列表
    if (d.list && Array.isArray(d.list)) d.list = filterAds(d.list);
  }

  $done({ body: JSON.stringify(obj) });
})();
