/**
 * bilibili_nav.js
 * 净化导航栏：
 *   - 底部 Tab：移除「会员购」
 *   - 顶部分类 Tab：移除「新征程」
 *   - 右上角：移除「游戏中心」图标入口
 *
 * 覆盖接口：
 *   /x/v2/navigation
 *   /x/v2/tab-management
 *   /x/v2/main/tab
 */

(() => {
  const body = $response.body;
  if (!body || body.length === 0) return $done({});

  let obj;
  try {
    obj = JSON.parse(body);
  } catch (e) {
    return $done({ body });
  }

  // ---- 需要过滤的关键字（name / title 字段）----
  // 底部 Tab 黑名单
  const BOTTOM_TAB_BLACKLIST = new Set([
    "会员购", "购", "商城", "会员购物", "mall"
  ]);

  // 顶部分类 Tab 黑名单
  const TOP_TAB_BLACKLIST = new Set([
    "新征程", "赛事", "游戏"
  ]);

  // 右上角功能入口黑名单（游戏中心等）
  const ICON_BLACKLIST = new Set([
    "游戏中心", "游戏", "game", "game_center",
    "腾讯游戏", "游戏推荐"
  ]);

  // 底部 Tab ID 黑名单（防止 name 字段混淆）
  // 6 = 会员购, 5 = 会员中心(有时), 根据实际抓包值调整
  const BOTTOM_ID_BLACKLIST = new Set([6]);

  /**
   * 统一判断是否命中黑名单
   */
  function hitBlacklist(item, nameSet, idSet) {
    const name = item.name || item.title || item.tab_name || "";
    const id   = item.id   || item.tab_id || -1;
    const uri  = item.uri  || item.link   || "";

    if (nameSet.has(name)) return true;
    if (idSet && idSet.has(id)) return true;

    // URI 包含 mall/game 字样
    if (uri.includes("mall.bilibili") || uri.includes("game.bilibili")) return true;

    return false;
  }

  // ---- 递归处理各层数据 ----

  function processData(d) {
    if (!d || typeof d !== "object") return;

    // ① 底部导航 Tab
    const bottomKeys = ["bottom", "bottom_items", "tab_items", "tabs"];
    for (const key of bottomKeys) {
      if (Array.isArray(d[key])) {
        d[key] = d[key].filter(
          item => !hitBlacklist(item, BOTTOM_TAB_BLACKLIST, BOTTOM_ID_BLACKLIST)
        );
      }
    }

    // ② 顶部分类 Tab（首页频道栏）
    const topKeys = ["top", "tab", "channel", "channels", "modules", "top_tab"];
    for (const key of topKeys) {
      if (Array.isArray(d[key])) {
        d[key] = d[key].filter(
          item => !hitBlacklist(item, TOP_TAB_BLACKLIST, null)
        );
      }
    }

    // ③ 右上角图标入口（游戏中心等）
    const iconKeys = ["right", "top_right", "icons", "function_entry", "sidebar"];
    for (const key of iconKeys) {
      if (Array.isArray(d[key])) {
        d[key] = d[key].filter(
          item => !hitBlacklist(item, ICON_BLACKLIST, null)
        );
      }
    }

    // ④ 兼容 {code, data, message} 包裹结构
    if (d.data && typeof d.data === "object") {
      processData(d.data);
    }
  }

  processData(obj);

  $done({ body: JSON.stringify(obj) });
})();
