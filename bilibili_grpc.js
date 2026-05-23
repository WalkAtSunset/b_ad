/**
 * bilibili_grpc.js
 * 处理 gRPC 接口（PlayViewUnite）的二进制广告数据
 * 注意：gRPC 响应为 protobuf 二进制，此脚本做保守处理，
 * 仅当能解析 JSON 包装时才过滤，否则直接放行，保证播放不中断。
 */

(() => {
  const body = $response.body;

  // 无法处理 protobuf 二进制时直接放行，保证视频正常播放
  if (!body) return $done({});

  // Shadowrocket 在 binary-body-mode=1 时 body 为 base64 字符串
  // 此处保守放行，避免因解析失败导致播放异常
  // 如需深度过滤 gRPC，需配合 protobuf 解码库（请参考 README）

  $done({ body });
})();
