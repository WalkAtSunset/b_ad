/**
 * bilibili_video.js
 * 过滤视频详情页广告相关字段：
 *   - 移除 pre-roll 广告标记
 *   - 移除视频页内推广卡片
 *   - 移除相关视频中的广告项
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

  if (obj.data) {
    const d = obj.data;

    // 移除片头广告时长标记
    if (d.player) {
      const p = d.player;
      if (p.toast) p.toast = null;
      if (p.pop_up) p.pop_up = null;
    }

    // 移除 operation_card（运营推广卡）
    if (d.operation_card) d.operation_card = null;

    // 移除 cm_card（商业卡片）
    if (d.cm_card) d.cm_card = null;

    // 移除广告层
    if (d.pre_ad_info) d.pre_ad_info = null;
    if (d.ad_info) d.ad_info = null;

    // 过滤相关视频推荐中的广告
    if (Array.isArray(d.relates)) {
      d.relates = d.relates.filter(item => {
        if (!item) return false;
        if (item.goto === "ad" || item.goto === "cm") return false;
        if (item.ad_info) return false;
        return true;
      });
    }

    // 过滭视频 tag 中的商业 tag
    if (Array.isArray(d.Tags)) {
      d.Tags = d.Tags.filter(tag => {
        if (!tag) return false;
        if (tag.is_activity === 1 && tag.likes === 0) return false; // 通常是运营 tag
        return true;
      });
    }
  }

  $done({ body: JSON.stringify(obj) });
})();
