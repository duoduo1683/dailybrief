/**
 * 每日自动更新脚本
 * 由 GitHub Actions 每天定时触发
 * 功能：更新页面日期、时间戳，添加"自动更新"标记
 */
const fs = require('fs');
const path = require('path');

const HTML_FILE = path.join(__dirname, '..', 'index.html');

// 获取当前时间（北京时间 = UTC+8）
function getBeijingTime() {
  const now = new Date();
  const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return {
    year: beijing.getUTCFullYear(),
    month: beijing.getUTCMonth() + 1,
    day: beijing.getUTCDate(),
    hour: beijing.getUTCHours(),
    minute: beijing.getUTCMinutes(),
    week: getWeekNumber(beijing)
  };
}

// 计算第几周
function getWeekNumber(date) {
  const start = new Date(date.getUTCFullYear(), 0, 1);
  const diff = (date - start) / 86400000;
  return Math.ceil((diff + start.getUTCDay() + 1) / 7);
}

// 主函数
function main() {
  console.log('=== 开始自动更新 ===');
  const time = getBeijingTime();
  const dateStr = `${time.month}月${time.day}日`;
  const timeStr = `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
  const fullDateStr = `${time.year}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(2, '0')} ${timeStr}`;

  console.log(`当前北京时间: ${fullDateStr}`);

  let html = fs.readFileSync(HTML_FILE, 'utf-8');
  let updated = false;

  // 1. 更新顶部导航日期 <span class="nav-date">7月12日</span>
  const navDateRegex = /(<span class="nav-date">)[^<]*(<\/span>)/;
  if (navDateRegex.test(html)) {
    html = html.replace(navDateRegex, `$1${dateStr}$2`);
    updated = true;
    console.log(`✓ 更新导航日期: ${dateStr}`);
  }

  // 2. 更新 LIVE 更新时间戳 id="updateTime"
  const updateTimeRegex = /(<[^>]*id="updateTime"[^>]*>)[^<]*(<\/[^>]+>)/;
  if (updateTimeRegex.test(html)) {
    html = html.replace(updateTimeRegex, `$1${timeStr} 自动更新$2`);
    updated = true;
    console.log(`✓ 更新时间戳: ${timeStr}`);
  }

  // 3. 在 <!-- AUTO-UPDATE-MARKER --> 位置插入更新记录（可选）
  const marker = '<!-- AUTO-UPDATE-MARKER -->';
  if (html.includes(marker)) {
    const updateNote = `<div style="font-size:0.65rem;color:var(--muted);text-align:center;padding:0.3rem;">🔄 GitHub Actions 自动更新 · ${fullDateStr}</div>`;
    html = html.replace(marker, marker + '\n' + updateNote);
    updated = true;
    console.log(`✓ 插入自动更新标记`);
  }

  if (updated) {
    fs.writeFileSync(HTML_FILE, html, 'utf-8');
    console.log(`\n=== 更新完成！时间: ${fullDateStr} ===`);
  } else {
    console.log('\n=== 无需更新 ===');
  }
}

try {
  main();
} catch (e) {
  console.error('更新失败:', e.message);
  process.exit(1);
}
